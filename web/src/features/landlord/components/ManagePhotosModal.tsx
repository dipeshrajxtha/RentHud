import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Check,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import type { LandlordProperty, LandlordPhoto } from '@/types/landlord';
import { landlordService } from '../landlord.service';

interface ManagePhotosModalProps {
  property: LandlordProperty;
  token: string;
  onClose: () => void;
  onPhotosUpdated: (propertyId: string, updatedPhotos: LandlordPhoto[]) => void;
}

export function ManagePhotosModal({
  property,
  token,
  onClose,
  onPhotosUpdated,
}: ManagePhotosModalProps) {
  const [photos, setPhotos] = useState<LandlordPhoto[]>(property.photos ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);

    try {
      const files = Array.from(fileList);
      const readPromises = files.map((file) => {
        return new Promise<{ data: string; caption?: string }>((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            reject(new Error(`File ${file.name} is not an image`));
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            reject(new Error(`File ${file.name} exceeds 10MB limit`));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result as string, caption: file.name.replace(/\.[^/.]+$/, '') });
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const processedFiles = await Promise.all(readPromises);
      const uploaded = await landlordService.uploadPropertyPhotos(
        property.id,
        processedFiles.map((f, i) => ({
          data: f.data,
          caption: f.caption,
          isCover: photos.length === 0 && i === 0,
        })),
        token
      );

      const newPhotos = [...photos, ...uploaded];
      setPhotos(newPhotos);
      onPhotosUpdated(property.id, newPhotos);
      setSuccessMsg(`Successfully uploaded ${uploaded.length} photo(s)!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);

    try {
      const uploaded = await landlordService.uploadPropertyPhotos(
        property.id,
        [
          {
            url: trimmed,
            caption: captionInput.trim() || undefined,
            isCover: photos.length === 0,
          },
        ],
        token
      );

      const newPhotos = [...photos, ...uploaded];
      setPhotos(newPhotos);
      onPhotosUpdated(property.id, newPhotos);
      setUrlInput('');
      setCaptionInput('');
      setSuccessMsg('Photo attached successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to attach image from URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetCover = async (photoId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(photoId);

    try {
      const updatedList = await landlordService.setPropertyCoverPhoto(property.id, photoId, token);
      setPhotos(updatedList);
      onPhotosUpdated(property.id, updatedList);
      setSuccessMsg('Cover photo updated!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to set cover photo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this property photo?')) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(photoId);

    try {
      await landlordService.deletePropertyPhoto(property.id, photoId, token);
      const remaining = photos.filter((p) => p.id !== photoId);
      // If we deleted the cover photo and there are remaining photos, mark first as cover in UI
      const hadCover = photos.find((p) => p.id === photoId)?.isCover;
      if (hadCover && remaining.length > 0 && !remaining.some((p) => p.isCover)) {
        remaining[0].isCover = true;
      }
      setPhotos(remaining);
      onPhotosUpdated(property.id, remaining);
      setSuccessMsg('Photo removed successfully');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete photo');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Property Images</h2>
              <p className="text-xs text-slate-500">
                {property.title} • {photos.length} {photos.length === 1 ? 'photo' : 'photos'} uploaded
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        <div className="px-6 pt-3 space-y-2">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                {isUploading
                  ? 'Uploading images to server…'
                  : 'Click or drag property photos here'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports JPG, PNG, WEBP, and GIF up to 10MB each. Select multiple files at once.
              </p>
              <button
                type="button"
                disabled={isUploading}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Browse Files</span>
              </button>
            </div>
          </div>

          {/* Add by Direct URL Option */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Or attach by Image URL</span>
            </div>
            <form onSubmit={handleAddUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Caption (optional)"
                className="sm:w-48 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={isUploading || !urlInput.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
              >
                Add URL
              </button>
            </form>
          </div>

          {/* Photos Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Gallery ({photos.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Click "Make Cover" to set the listing hero image.
              </p>
            </div>

            {photos.length === 0 ? (
              <div className="py-12 border border-slate-200 rounded-2xl text-center bg-slate-50/50">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No photos uploaded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload exterior, interior, or floor plan images above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <AnimatePresence>
                  {photos.map((ph) => {
                    const isLoading = actionLoadingId === ph.id;
                    return (
                      <motion.div
                        key={ph.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`group relative rounded-2xl overflow-hidden border transition-all ${
                          ph.isCover
                            ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="aspect-4/3 w-full bg-slate-100 relative overflow-hidden">
                          <img
                            src={ph.url}
                            alt={ph.caption || 'Property photo'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
                            }}
                          />

                          {/* Cover Badge */}
                          {ph.isCover && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              <span>Cover Photo</span>
                            </div>
                          )}

                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            {!ph.isCover && (
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleSetCover(ph.id)}
                                className="px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center gap-1"
                                title="Set as primary cover"
                              >
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>Make Cover</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleDeletePhoto(ph.id)}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Loading indicator for this photo */}
                          {isLoading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Caption / Footer */}
                        {ph.caption && (
                          <div className="p-2 bg-white border-t border-slate-100">
                            <p className="text-[11px] text-slate-600 truncate font-medium">
                              {ph.caption}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {photos.length} total photos • {photos.filter((p) => p.isCover).length} cover selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
