import { createClient } from '@supabase/supabase-js'

export async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, maxSizeKB = 60 } = {}) {
  return new Promise((resolve) => {
    if (!file || file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let quality = 0.7;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        function tryCompress(q) {
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > maxSizeKB * 1024 && q > 0.1) {
              if (q <= 0.3) {
                width = Math.round(width * 0.75);
                height = Math.round(height * 0.75);
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
              }
              tryCompress(q - 0.1);
            } else {
              const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(
                'Image: ' +
                  (file.size / 1024).toFixed(0) +
                  'KB → ' +
                  (compressed.size / 1024).toFixed(0) +
                  'KB (' +
                  width +
                  'x' +
                  height +
                  ', q=' +
                  q.toFixed(1) +
                  ')'
              );
              resolve(compressed);
            }
          }, 'image/jpeg', q);
        }
        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Use the same Supabase project as the TourBid app so tours, users, and bookings are shared.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to your app's project (or leave unset if using the same default).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mmwrdmevsrcwytrrdqis.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6XIXdn8ZHLJbXvfSKswyLw_AvNIia-J'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
