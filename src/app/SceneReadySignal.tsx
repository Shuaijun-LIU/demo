import { useEffect } from "react";
import { useMujoco } from "mujoco-react";

export function SceneReadySignal({ message, onReady }: { readonly message: string; readonly onReady: (message: string) => void }) {
  const mujoco = useMujoco();
  useEffect(() => {
    if (mujoco.isReady) onReady(message);
  }, [message, mujoco.isReady, onReady]);
  return null;
}
