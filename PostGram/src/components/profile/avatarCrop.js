const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("That image couldn't be read. Try another one."));
    image.src = src;
  });

/**
 * Center-crops any image (File or URL) into a 512px square JPEG for avatars.
 * Revokes object URLs it creates itself.
 */
export const cropSquareAvatar = async (source, zoom = 1) => {
  const isFile = typeof source !== "string";
  const src = isFile ? URL.createObjectURL(source) : source;

  try {
    const image = await loadImage(src);
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser couldn't process this image.");

    const scale = Math.max(size / image.width, size / image.height) * zoom;
    const width = image.width * scale;
    const height = image.height * scale;

    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      (size - width) / 2,
      (size - height) / 2,
      width,
      height,
    );

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );

    if (!blob) throw new Error("We couldn't process that image.");

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    if (isFile) URL.revokeObjectURL(src);
  }
};
