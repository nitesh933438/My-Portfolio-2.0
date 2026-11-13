import { useCallback, useEffect, useRef } from 'react';
import { isModalInStack, pushModalToStack, readModalStack } from '../utils/navigationHelpers';

export interface ModalCloseOptions {
  skipHistoryBack?: boolean;
}

/**
 * Syncs React modal open/close state with browser history (LIFO stack)
 * so device/browser Back closes only the topmost open modal/drawer
 * instead of navigating away from the current page.
 */
export function useModalHistory(
  isOpen: boolean,
  modalId: string,
  onClose: () => void
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const pushedByHookRef = useRef(false);
  const closingViaPopstateRef = useRef(false);
  const skipHistoryBackRef = useRef(false);
  const hashAtOpenRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const currentState = window.history.state && typeof window.history.state === 'object'
      ? window.history.state
      : {};
    const currentStack = readModalStack(currentState);

    if (!currentStack.includes(modalId)) {
      const nextStack = pushModalToStack(currentStack, modalId);
      window.history.pushState(
        { ...currentState, __modalStack: nextStack },
        ''
      );
      pushedByHookRef.current = true;
    } else {
      pushedByHookRef.current = false;
    }

    skipHistoryBackRef.current = false;
    closingViaPopstateRef.current = false;
    hashAtOpenRef.current = window.location.hash;

    const handlePopState = (event: PopStateEvent) => {
      if (!isOpenRef.current) return;
      if (!isModalInStack(event.state, modalId)) {
        closingViaPopstateRef.current = true;
        pushedByHookRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, modalId]);

  const closeModal = useCallback(
    (options?: ModalCloseOptions) => {
      if (!isOpenRef.current) return;

      const shouldSkipHistoryBack =
        Boolean(options?.skipHistoryBack) ||
        closingViaPopstateRef.current ||
        window.location.hash !== hashAtOpenRef.current;

      skipHistoryBackRef.current = shouldSkipHistoryBack;
      const shouldPopHistory =
        !shouldSkipHistoryBack &&
        pushedByHookRef.current &&
        isModalInStack(window.history.state, modalId);

      pushedByHookRef.current = false;
      onCloseRef.current();

      if (shouldPopHistory) {
        window.history.back();
      }
    },
    [modalId]
  );

  return { closeModal };
}
