import { useEffect, useState } from 'react';
import { apiRequest, endPoints } from '@ui/ui-lib';

/**
 * Resolves a wellness thumbnail fileId to a displayable blob URL on demand —
 * shared by the active card editor and every compact strip item, so a single
 * fetch pattern backs every place a thumbnail preview is shown.
 */
export function useThumbnailPreviewUrl(thumbnailFileId?: number | null) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;
        let objectUrl: string | null = null;

        if (!thumbnailFileId) {
            setUrl(null);
            return;
        }

        (async () => {
            try {
                const response = await apiRequest(endPoints.fileUploadDownloadById(thumbnailFileId), {
                    method: 'GET',
                    responseType: 'blob',
                });
                if (isCancelled) return;
                objectUrl = URL.createObjectURL(response.data as Blob);
                setUrl(objectUrl);
            } catch {
                if (!isCancelled) setUrl(null);
            }
        })();

        return () => {
            isCancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [thumbnailFileId]);

    return url;
}

export default useThumbnailPreviewUrl;
