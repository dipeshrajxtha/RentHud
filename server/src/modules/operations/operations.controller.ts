import type { Request, Response } from 'express';
import { db as defaultDb } from '../../../config/database.js';
import * as operationsService from './operations.service.js';
import { realtimeHub } from '../realtime/index.js';

export async function createMaintenanceTicketHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.db ?? defaultDb;
  const userId = req.user!.id;
  const result = await operationsService.createMaintenanceTicket(db, userId, req.body);
  realtimeHub.emitEvent('maintenance:created', result);
  res.status(201).json({ success: true, data: result });
}

export async function getMaintenanceTicketsHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.db ?? defaultDb;
  const userId = req.user!.id;
  const roles = req.user!.roles;
  const result = await operationsService.getMaintenanceTickets(db, userId, roles);
  res.json({ success: true, data: result });
}

export async function updateMaintenanceTicketHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.db ?? defaultDb;
  const userId = req.user!.id;
  const roles = req.user!.roles;
  const ticketId = req.params.id as string;
  const result = await operationsService.updateMaintenanceTicket(db, userId, roles, ticketId, req.body);
  realtimeHub.emitEvent('maintenance:updated', result);
  res.json({ success: true, data: result });
}

export async function getRentPaymentsHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.db ?? defaultDb;
  const userId = req.user!.id;
  const roles = req.user!.roles;
  const result = await operationsService.getRentPayments(db, userId, roles);
  res.json({ success: true, data: result });
}

export async function payRentHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.db ?? defaultDb;
  const userId = req.user!.id;
  const paymentId = req.params.id as string;
  const { paymentMethod, transactionId } = req.body;
  const result = await operationsService.payRentRecord(db, userId, paymentId, paymentMethod, transactionId);
  realtimeHub.emitEvent('payment:paid', result);
  res.json({ success: true, data: result });
}
