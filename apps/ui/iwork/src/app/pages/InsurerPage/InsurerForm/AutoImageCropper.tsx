import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  StyledCropperContainer,
  StyledCropperOuterBox,
  StyledCropperInnerBox,
  StyledZoomControlContainer,
  StyledZoomLabel,
  StyledZoomSlider,
  StyledZoomPercentage,
} from "./styles";

// Interface defining the crop area coordinates and dimensions in pixels
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Utility function to crop an image using HTML5 Canvas
 *
 * Takes an image source and crop coordinates, then creates a new cropped image file
 * using canvas manipulation. Returns a Promise that resolves to a File object.
 *
 * @param imageSrc - The source URL of the image to crop
 * @param pixelCrop - Crop area coordinates and dimensions
 * @param fileName - Name for the resulting cropped image file
 * @returns Promise<File> - The cropped image as a File object
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: CropArea,
  fileName: string = "cropped-image.jpg"
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Create a new image element and set up cross-origin handling
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";

    image.onload = () => {
      // Create canvas and get 2D drawing context
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Set canvas dimensions to match crop area
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Set canvas background color to white
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Convert canvas to blob and then to File object
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const file = new File([blob], fileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(file);
        },
        "image/jpeg",
        0.95 // JPEG quality (95%)
      );
    };
    // Handle image loading errors
    image.onerror = () => reject(new Error("Could not load image"));
  });
};

// Props interface for the AutoImageCropper component
interface AutoImageCropperProps {
  imageSrc: string; // Source URL of the image to crop
  divWidth?: number; // Width of the cropper container (default: 400px)
  divHeight?: number; // Height of the cropper container (default: 225px for 16:9)
  onCropChange?: (croppedAreaPixels: CropArea) => void; // Callback when crop area changes
}

/**
 * AutoImageCropper Component
 *
 * A React component that provides an image cropping interface with:
 * - Fixed 16:9 aspect ratio
 * - Zoom control with gradient slider
 * - Modern styling with rounded borders and shadows
 * - Callback support for crop area changes
 */
export const AutoImageCropper: React.FC<AutoImageCropperProps> = ({
  imageSrc,
  divWidth = 400, // Fixed container width
  divHeight = 225, // 16:9 aspect ratio (400/225 = 16/9)
  onCropChange,
}) => {
  // Current crop position (x, y coordinates)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  // Zoom level (1.0 = 100%, starts at 100%)
  const [zoom, setZoom] = useState(1);

  // Handle crop completion and notify parent component
  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: CropArea) => {
      if (onCropChange) {
        onCropChange(croppedAreaPixels);
      }
    },
    [onCropChange]
  );

  return (
    <StyledCropperContainer>
      {/* Main cropper container with gradient border styling */}
      <StyledCropperOuterBox divWidth={divWidth} divHeight={divHeight}>
        {/* Inner container for the actual cropper */}
        <StyledCropperInnerBox>
          {/* React Easy Crop component with fixed crop size and 16:9 aspect ratio */}
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9} // Fixed 16:9 aspect ratio
            cropSize={{ width: 320, height: 180 }} // Fixed crop box size
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            showGrid={true} // Show grid lines for better precision
            cropShape="rect" // Rectangular crop shape
            minZoom={1} // Minimum zoom level (100%)
            maxZoom={5} // Maximum zoom level (500%)
            restrictPosition={false} // Allow free positioning
            style={{
              containerStyle: {
                borderRadius: "13px",
              },
            }}
          />
        </StyledCropperInnerBox>
      </StyledCropperOuterBox>

      {/* Zoom Control Section */}
      <StyledZoomControlContainer>
        {/* Zoom label */}
        <StyledZoomLabel>Zoom:</StyledZoomLabel>
        {/* Zoom slider with gradient styling */}
        <StyledZoomSlider
          type="range"
          min={1} // 100% minimum zoom
          max={5} // 500% maximum zoom
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        {/* Zoom percentage display */}
        <StyledZoomPercentage>{Math.round(zoom * 100)}%</StyledZoomPercentage>
      </StyledZoomControlContainer>
    </StyledCropperContainer>
  );
};