import { INIT_BRUSH } from "@lib/constants";
import { IBrush } from "@types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Canvas.module.scss";
export interface CanvasProps {}

const _arc = (context: CanvasRenderingContext2D) => {
  return {
    draw: function (x: number, y: number, r: number, color: string) {
      context.beginPath();
      context.fillStyle = color;
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
      context.closePath();
    },
  };
};

const _square = (context: CanvasRenderingContext2D) => {
  return {
    draw: function (x: number, y: number, w: number, h: number, color: string) {
      context.beginPath();
      context.fillStyle = color;
      context.rect(x, y, w, h);
      context.fill();
      context.closePath();
    },
  };
};

const render = {
  arc: (context: CanvasRenderingContext2D) => _arc(context),
  square: (context: CanvasRenderingContext2D) => _square(context),
};

export const Canvas = ({}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [brush, setBrush] = useState<IBrush>(INIT_BRUSH);
  const [link, setLink] = useState<string>("");

  const mouseMove = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      const down = downRef.current;
      if (context && down) {
        const { color, opacity, width, height, type } = brush;
        const x = event.offsetX;
        const y = event.offsetY;
        const c =
          event.buttons == 1 ? `${color.primary}` : `${color.secondary}`;
        switch (type) {
          case "arc":
            render
              .arc(context)
              .draw(x - width / 16, y - width / 16, width / 2, c);
            break;
          case "square":
            render
              .square(context)
              .draw(x - width / 2, y - width / 2, width, height, c);
            break;
          default:
            break;
        }
      }
    },
    [brush, context]
  );

  const downRef = useRef<{ x: number; y: number } | null>(null);

  const mouseDown = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      downRef.current = { x: event.offsetX, y: event.offsetY };
      if (canvas) {
        canvas.addEventListener("mousemove", mouseMove);
      }
    },
    [mouseMove]
  );

  const mouseUp = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;
      const down = downRef.current;
      if (canvas && context && down) {
        const dataURL = canvas.toDataURL("image/png");
        setLink(dataURL);
        canvas.removeEventListener("mousemove", mouseMove);
        downRef.current = null;
      }
    },
    [context, mouseMove]
  );

  const clearMouse = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.removeEventListener("mousemove", mouseMove);
    }
  }, [mouseMove]);

  useEffect(() => {
    window.addEventListener("mousemove", clearMouse);
    return () => {
      window.removeEventListener("mousemove", clearMouse);
    };
  }, [clearMouse]);

  useEffect(() => {
    // init canvas dimensions and drawing context
    const canvas = canvasRef.current;
    const { innerHeight, innerWidth } = window;

    if (canvas) {
      const newContext = canvas.getContext("2d");
      setContext(newContext);
      canvas.width = innerWidth - 220;
      canvas.height = innerHeight;
    }
  }, []);

  const contextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && context) {
      // todo - research globalCompositeOperation
      // context.globalCompositeOperation = "copy";

      canvas.addEventListener("mousedown", mouseDown);
      canvas.addEventListener("mouseup", mouseUp);
      return () => {
        canvas.removeEventListener("mousedown", mouseDown);
        canvas.removeEventListener("mouseup", mouseUp);
      };
    }
  }, [context, mouseDown, mouseUp]);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <canvas
          className={styles.container}
          ref={canvasRef}
          onContextMenu={contextMenu}
        />
      </div>
    </div>
  );
};
