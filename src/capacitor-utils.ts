// 检测是否在Capacitor环境中
const isCapacitorEnv = (): boolean => {
  return !!(window as any).Capacitor;
};

// 使用相机拍照
export const takePhoto = async () => {
  if (!isCapacitorEnv()) return null;
  
  const { Camera } = (window as any).Capacitor.Plugins;
  
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    
    return image;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// 从相册选择图片
export const pickImage = async () => {
  if (!isCapacitorEnv()) return null;
  
  const { Camera } = (window as any).Capacitor.Plugins;
  
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    });
    
    return image;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

// 保存图片到相册
export const saveImageToGallery = async (base64Image: string) => {
  if (!isCapacitorEnv()) return false;
  
  const { Filesystem } = (window as any).Capacitor.Plugins;
  
  try {
    // 移除base64前缀
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const fileName = `drawtoday_${Date.now()}.jpg`;
    
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.ExternalStorage,
      recursive: true
    });
    
    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

// 将图片URI转换为Base64
export const convertImageToBase64 = async (uri: string): Promise<string | null> => {
  if (!isCapacitorEnv()) return null;
  
  const { Filesystem } = (window as any).Capacitor.Plugins;
  
  try {
    const file = await Filesystem.readFile({
      path: uri
    });
    
    return `data:image/jpeg;base64,${file.data}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};
