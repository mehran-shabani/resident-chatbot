import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

// Set the worker source for pdf.js to load the worker script from the CDN.
// This is necessary for processing PDFs in a separate thread without blocking the UI.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.175/build/pdf.worker.min.mjs`;


export const toBase64 = (file: File): Promise<{ data: string; previewUrl: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:mime/type;base64,..."
      // we need to strip the prefix for the Gemini API
      const data = result.split(',')[1];
      resolve({ data, previewUrl: result });
    };
    reader.onerror = (error) => reject(error);
  });

export const processPdf = async (file: File): Promise<{ mimeType: string; data: string; }[]> => {
    const fileReader = new FileReader();
  
    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error("Failed to read PDF file."));
        }
        try {
          const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const pagePromises = [];
          
          // Process all pages, up to a reasonable limit to avoid performance issues.
          const numPagesToProcess = Math.min(pdf.numPages, 20);

          for (let i = 1; i <= numPagesToProcess; i++) {
            pagePromises.push(pdf.getPage(i).then(page => {
              const viewport = page.getViewport({ scale: 1.5 }); // Scale for better resolution
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (!context) {
                throw new Error('Could not get canvas context');
              }

              return page.render({ canvasContext: context, viewport: viewport }).promise.then(() => {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG for smaller size
                const data = dataUrl.split(',')[1];
                return { mimeType: 'image/jpeg', data };
              });
            }));
          }

          const pageImages = await Promise.all(pagePromises);
          resolve(pageImages);
        } catch (error) {
          console.error("Error processing PDF:", error);
          reject(new Error("فایل PDF نامعتبر است یا مشکلی در پردازش آن وجود دارد."));
        }
      };
      fileReader.onerror = (error) => reject(error);
      fileReader.readAsArrayBuffer(file);
    });
  };
  