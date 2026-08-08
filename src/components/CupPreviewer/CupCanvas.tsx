"use client";

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Rect } from 'react-konva';
import useImage from 'use-image';

interface CupCanvasProps {
  uploadedImageSrc: string | null;
}

export default function CupCanvas({ uploadedImageSrc }: CupCanvasProps) {
  const [cupBg] = useImage('/cup.jpg'); 
  const [userImage] = useImage(uploadedImageSrc || '');
  
  const imageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (userImage && imageRef.current && trRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [userImage]);

  // --- MUG PRINTABLE AREA DIMENSIONS ---
  // Adjusted to better center on the cup in your screenshot
  const clipX = 60; 
  const clipY = 140;
  const clipWidth = 250;
  const clipHeight = 260;
  const curveOffset = 15; // The amount the top and bottom edges curve down

  return (
    <Stage width={500} height={500} className="rounded-xl overflow-hidden shadow-lg border border-lila-pastel bg-white">
      <Layer>
        {/* Layer 1: The Base Cup Image */}
        {cupBg && <KonvaImage image={cupBg} width={500} height={500} />}

        {/* Layer 2: The Printable Area with Curved Clipping */}
        <Group
          clipFunc={(ctx) => {
            // Drawing a custom shape for the mask to mimic the cylinder's perspective
            ctx.beginPath();
            // Top edge (curved down)
            ctx.moveTo(clipX, clipY);
            ctx.quadraticCurveTo(clipX + clipWidth / 2, clipY + curveOffset, clipX + clipWidth, clipY);
            // Right edge
            ctx.lineTo(clipX + clipWidth, clipY + clipHeight);
            // Bottom edge (curved down)
            ctx.quadraticCurveTo(clipX + clipWidth / 2, clipY + clipHeight + curveOffset, clipX, clipY + clipHeight);
            // Left edge
            ctx.lineTo(clipX, clipY);
            ctx.closePath();
          }}
        >
          {/* The User's Uploaded Image */}
          {userImage && (
            <KonvaImage
              ref={imageRef}
              image={userImage}
              x={130}      
              y={160}
              width={160}  
              height={160} 
              draggable    
            />
          )}
          
          {/* The Transformer */}
          {userImage && (
            <Transformer
              ref={trRef}
              rotateEnabled={true}
              rotationSnaps={[0, 90, 180, 270]} 
              padding={5}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 30 || newBox.height < 30) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}

          {/* Layer 3: The 3D Shadow Overlay Illusion */}
          {/* This sits ON TOP of the image to add cylindrical shadows, but listening={false} ensures the user can still click the image underneath */}
          <Rect
            x={clipX}
            y={clipY}
            width={clipWidth}
            height={clipHeight}
            listening={false} 
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: clipWidth, y: 0 }}
            fillLinearGradientColorStops={[
              0, 'rgba(0,0,0,0.25)',      // Darker shadow on the far left edge
              0.15, 'rgba(255,255,255,0.1)', // Slight highlight
              0.8, 'rgba(255,255,255,0)', // Completely transparent in the middle
              1, 'rgba(0,0,0,0.3)'        // Dark shadow on the right edge (near handle)
            ]}
          />
        </Group>
      </Layer>
    </Stage>
  );
}