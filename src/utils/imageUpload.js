import supabase from './supabase.jsx';

export const uploadImageToSupabase = async (imageBlob, fileName) => {
    try {
        const { error } = await supabase.storage
            .from('images')
            .upload(fileName, imageBlob, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export const cropAndUploadImage = async (imageSrc, cropBox) => {
    try {
        // Create a canvas to crop the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Wait for the image to load
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageSrc;
        });

        // Set canvas size to match the crop dimensions
        canvas.width = cropBox.right - cropBox.left;
        canvas.height = cropBox.bottom - cropBox.top;

        // Draw the cropped portion
        ctx.drawImage(
            img,
            cropBox.left,
            cropBox.top,
            cropBox.right - cropBox.left,
            cropBox.bottom - cropBox.top,
            0,
            0,
            cropBox.right - cropBox.left,
            cropBox.bottom - cropBox.top
        );

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        
        // Upload to Supabase
        const publicUrl = await uploadImageToSupabase(blob, cropBox.name);
        
        return {
            index: cropBox.index,
            name: cropBox.name,
            filename: cropBox.name,
            url: publicUrl
        };
    } catch (error) {
        console.error('Error in cropAndUploadImage:', error);
        throw error;
    }
};

export const deleteImageFromSupabase = async (fileName) => {
    try {
        const { error } = await supabase.storage
            .from('images')
            .remove([fileName]);

        if (error) {
            throw error;
        }
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}; 