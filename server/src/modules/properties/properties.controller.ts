import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  searchProperties,
  getPropertyById,
  createProperty,
  getLandlordProperties,
  updateProperty,
  deleteProperty,
  createUnit,
  getUnitsByProperty,
  updateUnit,
  deleteUnit,
  addPropertyPhotos,
  deletePropertyPhoto,
  setPropertyCoverPhoto,
} from './properties.service.js';
import { sendSuccess } from '../../common/utils/response.js';
import { realtimeHub } from '../realtime/index.js';
import type {
  PropertySearchQuery,
  PropertyIdParam,
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateUnitInput,
  UpdateUnitInput,
  PropertyAndUnitIdParam,
  AddPropertyPhotosInput,
  PropertyPhotoParam,
} from './properties.schemas.js';

export function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * GET /api/properties
 * Public browsing and spatial discovery of rental listings.
 */
export async function browseProperties(
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const query = req.query as unknown as PropertySearchQuery;
    const result = await searchProperties(db, query);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/properties/:id
 * Public rental listing details. Safe public fields only.
 */
export async function getListingDetails(
  req: Request<PropertyIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const property = await getPropertyById(db, req.params.id);
    sendSuccess(res, property, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/properties
 * Landlord creates a new physical property asset.
 */
export async function createPropertyHandler(
  req: Request<{}, {}, CreatePropertyInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await createProperty(db, req.user!.id, req.body);
    realtimeHub.emitEvent('property:created', result);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/properties/mine
 * Lists all properties owned by the authenticated landlord.
 */
export async function getMyPropertiesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await getLandlordProperties(db, req.user!.id);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/properties/:id
 * Updates property fields with ownership verification.
 */
export async function updatePropertyHandler(
  req: Request<PropertyIdParam, {}, UpdatePropertyInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await updateProperty(db, req.params.id, req.user!.id, req.body);
    realtimeHub.emitEvent('property:updated', result);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/properties/:id
 * Soft deactivates a property if no active tenancies exist.
 */
export async function deletePropertyHandler(
  req: Request<PropertyIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await deleteProperty(db, req.params.id, req.user!.id);
    realtimeHub.emitEvent('property:deleted', result);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/properties/:id/units
 * Creates a rental unit under the specified property.
 */
export async function createUnitHandler(
  req: Request<PropertyIdParam, {}, CreateUnitInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await createUnit(db, req.params.id, req.user!.id, req.body);
    realtimeHub.emitEvent('unit:created', result);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/properties/:id/units
 * Lists all units for a given property.
 */
export async function getPropertyUnitsHandler(
  req: Request<PropertyIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await getUnitsByProperty(db, req.params.id, req.user?.id);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/properties/:propertyId/units/:unitId
 * Updates unit configuration and availability with state validation.
 */
export async function updateUnitHandler(
  req: Request<PropertyAndUnitIdParam, {}, UpdateUnitInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await updateUnit(
      db,
      req.params.propertyId,
      req.params.unitId,
      req.user!.id,
      req.body
    );
    realtimeHub.emitEvent('unit:updated', result);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/properties/:propertyId/units/:unitId
 * Deletes or marks unit UNAVAILABLE with ownership check.
 */
export async function deleteUnitHandler(
  req: Request<PropertyAndUnitIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await deleteUnit(
      db,
      req.params.propertyId,
      req.params.unitId,
      req.user!.id
    );
    realtimeHub.emitEvent('unit:deleted', result);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/properties/:id/photos
 * Landlord uploads/adds photos to their property.
 */
export async function addPropertyPhotosHandler(
  req: Request<PropertyIdParam, {}, AddPropertyPhotosInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await addPropertyPhotos(
      db,
      req.user!.id,
      req.params.id,
      req.body.photos
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/properties/:id/photos/:photoId
 * Landlord removes a photo from their property.
 */
export async function deletePropertyPhotoHandler(
  req: Request<PropertyPhotoParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await deletePropertyPhoto(
      db,
      req.user!.id,
      req.params.id,
      req.params.photoId
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/properties/:id/photos/:photoId/cover
 * Sets the specified photo as the primary cover photo for the property.
 */
export async function setPropertyCoverPhotoHandler(
  req: Request<PropertyPhotoParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await setPropertyCoverPhoto(
      db,
      req.user!.id,
      req.params.id,
      req.params.photoId
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

