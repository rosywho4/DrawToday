const isCapacitorEnv = (): boolean => {
  return !!(window as any).Capacitor;
};

type CameraResultType = {
  Uri: 'uri';
  Base64: 'base64';
  DataUrl: 'dataUrl';
};

type CameraSource = {
  Camera: 'camera';
  Photos: 'photos';
  Prompt: 'prompt';
};

enum FilesystemDirectory {
  ExternalStorage = 'external',
  SharedExternal = 'sharedexternal'
}

const getCameraTypes = () => {
  const Capacitor = (window as any).Capacitor;
  if (!Capacitor?.Plugins?.Camera) {
    return {
      CameraResultType: { Uri: 'uri' } as CameraResultType,
      CameraSource: { Camera: 'camera', Photos: 'photos' } as CameraSource
    };
  }
  return {
    CameraResultType: Capacitor.Plugins.CameraResultType,
    CameraSource: Capacitor.Plugins.CameraSource
  };
};

export const takePhoto = async () => {
  if (!isCapacitorEnv()) return null;

  const { Camera } = (window as any).Capacitor.Plugins;
  const { CameraResultType, CameraSource } = getCameraTypes();

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

export const pickImage = async () => {
  if (!isCapacitorEnv()) return null;

  const { Camera } = (window as any).Capacitor.Plugins;
  const { CameraResultType, CameraSource } = getCameraTypes();

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

export const saveImageToGallery = async (base64Image: string) => {
  if (!isCapacitorEnv()) return false;

  const { Filesystem } = (window as any).Capacitor.Plugins;

  try {
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
