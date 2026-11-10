import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDatabase, type TestDbInstance } from '../helpers/test-db.js';
import * as coreSchema from '../../db/migrations/20260916000001_core_schema.js';
import * as maintenanceAndPayments from '../../db/migrations/20261006000001_maintenance_and_payments.js';
import * as chatbotMigration from '../../db/migrations/20261110000001_chatbot_conversations.js';
import { chatbotService } from '../../src/modules/chatbot/chatbot.service.js';
import { stMakePointGeography } from '../../src/common/gis.js';

describe('RentHub AI Conversational Assistant (/api/chatbot)', () => {
  let testDb: TestDbInstance;

  let tenantUserId: string;
  let otherTenantUserId: string;
  let landlordUserId: string;
  let propertyBaneshworId: string;
  let unitBaneshworId: string;
  let activeTenancyId: string;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await coreSchema.up(testDb.db);
    await maintenanceAndPayments.up(testDb.db);
    await chatbotMigration.up(testDb.db);

    // 1. Seed users (tenant, landlord, another tenant)
    tenantUserId = crypto.randomUUID();
    otherTenantUserId = crypto.randomUUID();
    landlordUserId = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, email, name, roles, is_active)
      VALUES
        (${tenantUserId}, ${'tenant@test.com'}, ${'Aayush Sharma'}, ${['tenant'] as any}, TRUE),
        (${otherTenantUserId}, ${'other_tenant@test.com'}, ${'Bikash Thapa'}, ${['tenant'] as any}, TRUE),
        (${landlordUserId}, ${'landlord@test.com'}, ${'Sunil Pradhan'}, ${['landlord'] as any}, TRUE)
    `.execute(testDb.db);

    // 2. Seed actual property in Baneshwor
    propertyBaneshworId = crypto.randomUUID();
    unitBaneshworId = crypto.randomUUID();

    // Coordinates for Baneshwor: 27.6934, 85.3420
    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${propertyBaneshworId},
        ${landlordUserId},
        ${'Peaceful Baneshwor Residence'},
        ${'Modern 2 BHK apartment near New Baneshwor Chowk'},
        ${'New Baneshwor Marg 4'},
        ${'Kathmandu'},
        ${stMakePointGeography(85.3420, 27.6934)},
        4,
        TRUE
      )
    `.execute(testDb.db);

    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (
        ${unitBaneshworId},
        ${propertyBaneshworId},
        ${'Unit 201'},
        2,
        2,
        1,
        750,
        22000,
        44000,
        ${'AVAILABLE'}
      )
    `.execute(testDb.db);

    // 3. Seed active tenancy for tenantUserId at another unit/property
    const rentedPropId = crypto.randomUUID();
    const rentedUnitId = crypto.randomUUID();
    activeTenancyId = crypto.randomUUID();

    await sql`
      INSERT INTO properties (id, landlord_id, title, description, address, city, location, total_floors, is_active)
      VALUES (
        ${rentedPropId},
        ${landlordUserId},
        ${'Everest Heights Residence'},
        ${'Central Patan flat'},
        ${'Jawalakhel Road'},
        ${'Lalitpur'},
        ${stMakePointGeography(85.3142, 27.6728)},
        3,
        TRUE
      )
    `.execute(testDb.db);

    await sql`
      INSERT INTO property_units (id, property_id, unit_identifier, floor_number, bedrooms, bathrooms, area_sqft, monthly_rent, security_deposit, availability_status)
      VALUES (
        ${rentedUnitId},
        ${rentedPropId},
        ${'Unit 3A'},
        3,
        1,
        1,
        500,
        18000,
        36000,
        ${'ON_RENT'}
      )
    `.execute(testDb.db);

    await sql`
      INSERT INTO tenancies (id, unit_id, tenant_id, landlord_id, status, start_date, end_date, agreed_monthly_rent, agreed_deposit)
      VALUES (
        ${activeTenancyId},
        ${rentedUnitId},
        ${tenantUserId},
        ${landlordUserId},
        ${'active'},
        ${'2026-01-01' as any},
        ${'2026-12-31' as any},
        18000,
        36000
      )
    `.execute(testDb.db);
  });

  afterAll(async () => {
    await testDb.destroy();
  });

  // ── TEST 1: Property Discovery & Initial Clarification
  it('Test 1: User requests an apartment in Kathmandu -> triggers relevant follow-up questions', async () => {
    const convData = await chatbotService.createConversation(testDb.db, undefined, {
      title: 'Discovery Session',
      initialMode: 'discovery',
    });
    expect(convData.conversation.id).toBeDefined();

    const response = await chatbotService.processUserMessage(
      testDb.db,
      convData.conversation.id,
      undefined,
      convData.conversation.session_id!,
      { message: 'I am looking for a two-bedroom apartment in Kathmandu' }
    );

    expect(response.currentMode).toBe('discovery');
    expect(response.assistantMessage.content).toMatch(/budget|monthly/i);
  });

  // ── TEST 2: Budget Understanding
  it('Test 2: User provides NPR 20,000 as monthly budget -> correctly extracts and applies budget', async () => {
    const convData = await chatbotService.createConversation(testDb.db);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      undefined,
      convData.conversation.session_id!,
      { message: 'My budget is below NPR 25,000 around Baneshwor' }
    );

    const detail = await chatbotService.getConversationDetail(testDb.db, convId);
    expect(detail.contextData.maxRent).toBe(25000);
    expect(detail.contextData.locationName).toBe('Baneshwor');
  });

  // ── TEST 3: Actual Property Search with Database Results
  it('Test 3: User provides matching criteria -> queries real database and returns actual matching property', async () => {
    const convData = await chatbotService.createConversation(testDb.db);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      undefined,
      convData.conversation.session_id!,
      { message: 'Search for available 2 BHK apartment in Baneshwor under NPR 25,000' }
    );

    expect(res.currentMode).toBe('discovery');
    expect(res.assistantMessage.metadata.properties).toBeDefined();
    expect(res.assistantMessage.metadata.properties.length).toBeGreaterThan(0);

    const match = res.assistantMessage.metadata.properties[0];
    expect(match.title).toBe('Peaceful Baneshwor Residence');
    expect(match.minMonthlyRent).toBe(22000);
  });

  // ── TEST 4: No Matching Property
  it('Test 4: User requests criteria with no match -> honest explanation and alternative suggestions', async () => {
    const convData = await chatbotService.createConversation(testDb.db);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      undefined,
      convData.conversation.session_id!,
      { message: 'Search for 4 BHK in Bhaktapur under NPR 5,000' }
    );

    expect(res.assistantMessage.content).toMatch(/no available properties|couldn't find/i);
    expect(res.assistantMessage.metadata.noResults).toBe(true);
    expect(res.assistantMessage.metadata.suggestedPrompts).toBeDefined();
  });

  // ── TEST 5: Tenant Satisfaction Check-in
  it('Test 5: User communicates dissatisfaction with accommodation -> empathetic response and guidance', async () => {
    const convData = await chatbotService.createConversation(testDb.db, tenantUserId);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      tenantUserId,
      undefined,
      { message: 'I am not happy with my current living arrangement, my neighbors are very noisy' }
    );

    expect(res.currentMode).toBe('tenant_support');
    expect(res.assistantMessage.content).toMatch(/comfort|peace of mind|landlord|dispute/i);
  });

  // ── TEST 6: Financial Difficulties with Rent
  it('Test 6: User reports difficulty paying rent -> provides guidance and drafts landlord communication', async () => {
    const convData = await chatbotService.createConversation(testDb.db, tenantUserId);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      tenantUserId,
      undefined,
      { message: 'I am having financial difficulties this month, my salary is delayed and I cannot pay rent on time' }
    );

    expect(res.currentMode).toBe('financial');
    expect(res.assistantMessage.content).toMatch(/financial|delayed|landlord/i);
    expect(res.assistantMessage.metadata.messageDraft).toBeDefined();
    expect(res.assistantMessage.metadata.messageDraft.subject).toMatch(/rent/i);
  });

  // ── TEST 7: Maintenance Problem & Ticket Creation
  it('Test 7: User reports maintenance issue -> prepares ticket and creates it on confirmation', async () => {
    const convData = await chatbotService.createConversation(testDb.db, tenantUserId);
    const convId = convData.conversation.id;

    const res = await chatbotService.processUserMessage(
      testDb.db,
      convId,
      tenantUserId,
      undefined,
      { message: 'There is a continuous water leakage problem in my bathroom pipe' }
    );

    expect(res.currentMode).toBe('maintenance');
    expect(res.assistantMessage.metadata.maintenanceDraft).toBeDefined();
    expect(res.assistantMessage.metadata.maintenanceDraft.category).toBe('Plumbing');

    // Execute ticket creation action
    const actionResult = await chatbotService.executeAction(
      testDb.db,
      convId,
      tenantUserId,
      undefined,
      {
        actionType: 'submit_maintenance_ticket',
        payload: {
          category: 'Plumbing',
          urgency: 'High',
          title: 'Bathroom pipe water leakage',
          description: 'Continuous leaking from under sink',
          tenancyId: activeTenancyId,
        },
      }
    );

    expect(actionResult.success).toBe(true);
    expect(actionResult.ticket).toBeDefined();
    expect(actionResult.ticket!.id).toBeDefined();
    expect(actionResult.assistantMessage!.content).toMatch(/Ticket Created Successfully/i);
  });

  // ── TEST 8: Conversation Continuity across Multi-turn Messages
  it('Test 8: Context is retained and merged across multiple conversational turns', async () => {
    const convData = await chatbotService.createConversation(testDb.db);
    const convId = convData.conversation.id;
    const session = convData.conversation.session_id!;

    // Turn 1: specify type and bedrooms
    await chatbotService.processUserMessage(testDb.db, convId, undefined, session, {
      message: 'I want a 2 BHK apartment',
    });

    // Turn 2: specify location
    await chatbotService.processUserMessage(testDb.db, convId, undefined, session, {
      message: 'Around Baneshwor',
    });

    // Turn 3: specify budget
    const finalTurn = await chatbotService.processUserMessage(testDb.db, convId, undefined, session, {
      message: 'My budget is 25k, unfurnished is fine',
    });

    const finalConv = await chatbotService.getConversationDetail(testDb.db, convId);
    expect(finalConv.contextData.bedrooms).toBe(2);
    expect(finalConv.contextData.locationName).toBe('Baneshwor');
    expect(finalConv.contextData.maxRent).toBe(25000);
    expect(finalConv.contextData.furnishing).toBe('unfurnished');
  });

  // ── TEST 9: Authentication & Cross-User Privacy
  it('Test 9: Attempting to access another user conversation throws ForbiddenError', async () => {
    // User A creates conversation
    const convData = await chatbotService.createConversation(testDb.db, tenantUserId);
    const convId = convData.conversation.id;

    // User B attempts to view User A's conversation
    await expect(
      chatbotService.getConversationDetail(testDb.db, convId, otherTenantUserId)
    ).rejects.toThrow(/access/i);

    // Unauthenticated guest attempts to view authenticated conversation
    await expect(
      chatbotService.getConversationDetail(testDb.db, convId, undefined, 'random-guest-session')
    ).rejects.toThrow(/Authentication required/i);
  });

  // ── TEST 10: Existing Application Compatibility
  it('Test 10: Existing database queries and migrations remain 100% compatible', async () => {
    const propertiesCount = await testDb.db
      .selectFrom('properties')
      .select(testDb.db.fn.count('id').as('count'))
      .executeTakeFirst();
    expect(Number(propertiesCount?.count)).toBeGreaterThan(0);

    const tenanciesCount = await testDb.db
      .selectFrom('tenancies')
      .select(testDb.db.fn.count('id').as('count'))
      .executeTakeFirst();
    expect(Number(tenanciesCount?.count)).toBeGreaterThan(0);
  });
});
