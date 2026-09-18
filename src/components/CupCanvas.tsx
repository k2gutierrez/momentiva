"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Rect } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";

export interface AjusteTaza {
  x: number;
  y: number;
  escala: number;
  rotacion: number;
}

interface CupCanvasProps {
  uploadedImageSrc: string | null;
  /** Se llama con la vista compuesta (foto dentro de la taza) cada vez que cambia el diseño. */
  onSnapshot?: (dataUrl: string, ajuste: AjusteTaza) => void;
}

export default function CupCanvas({ uploadedImageSrc, onSnapshot }: CupCanvasProps) {
  const [cupBg] = useImage("/cup.jpg");
  const [userImage] = useImage(uploadedImageSrc || "");

  const stageRef = useRef<Konva.Stage>(null);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Guardamos el callback en un ref para que exportarVista sea estable y el
  // efecto de abajo no se dispare en cada render (evita un bucle de capturas).
  const snapshotRef = useRef(onSnapshot);
  useEffect(() => {
    snapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    const imageNode = imageRef.current;
    const trNode = trRef.current;
    if (userImage && imageNode && trNode) {
      trNode.nodes([imageNode]);
      trNode.getLayer()?.batchDraw();
    }
  }, [userImage]);

  /**
   * Exporta el lienzo tal como se ve (taza + foto + sombra) para que el taller
   * sepa exactamente cómo debe imprimirse. Se oculta el marco del transformador
   * para que no salga en la imagen.
   */
  const exportarVista = useCallback(() => {
    const stage = stageRef.current;
    const imageNode = imageRef.current;
    if (!stage || !imageNode) return;

    const tr = trRef.current;
    const estabaVisible = tr?.visible() ?? false;
    tr?.visible(false);
    stage.batchDraw();

    let dataUrl = "";
    try {
      dataUrl = stage.toDataURL({ pixelRatio: 1, mimeType: "image/jpeg", quality: 0.85 });
    } catch {
      dataUrl = "";
    }

    tr?.visible(estabaVisible);
    stage.batchDraw();

    if (dataUrl) {
      snapshotRef.current?.(dataUrl, {
        x: Math.round(imageNode.x()),
        y: Math.round(imageNode.y()),
        escala: Number(imageNode.scaleX().toFixed(2)),
        rotacion: Math.round(imageNode.rotation()),
      });
    }
  }, []);

  // Primera captura en cuanto la imagen del cliente está lista dentro de la taza
  useEffect(() => {
    if (!userImage) return;
    const t = setTimeout(exportarVista, 150);
    return () => clearTimeout(t);
  }, [userImage, exportarVista]);

  // --- MUG PRINTABLE AREA DIMENSIONS ---
  const clipX = 60;
  const clipY = 140;
  const clipWidth = 250;
  const clipHeight = 260;
  const curveOffset = 15; // The amount the top and bottom edges curve down

  return (
    <Stage
      ref={stageRef}
      width={500}
      height={500}
      className="rounded-xl overflow-hidden shadow-lg border border-lila-pastel bg-white"
    >
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
              onDragEnd={exportarVista}
              onTransformEnd={exportarVista}
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
          <Rect
            x={clipX}
            y={clipY}
            width={clipWidth}
            height={clipHeight}
            listening={false}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: clipWidth, y: 0 }}
            fillLinearGradientColorStops={[
              0, "rgba(0,0,0,0.25)",
              0.15, "rgba(255,255,255,0.1)",
              0.8, "rgba(255,255,255,0)",
              1, "rgba(0,0,0,0.3)",
            ]}
          />
        </Group>
      </Layer>
    </Stage>
  );
}
