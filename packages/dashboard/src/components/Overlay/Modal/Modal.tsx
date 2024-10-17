import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface ModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  onAction?: () => void;
  children?: ReactNode;
  action?: string;
  type: "info" | "danger";
  icon?: ReactNode;
  isActionDisabled?: boolean; // Add this new optional prop
}

/**
 * @param root0
 * @param root0.isOpen
 * @param root0.onToggle
 * @param root0.onAction
 * @param root0.children
 * @param root0.action
 * @param root0.type
 * @param root0.title
 * @param root0.description
 * @param root0.icon
 */
export default function Modal({
  title,
  description,
  isOpen,
  onToggle,
  onAction,
  children,
  action,
  type,
  icon,
  isActionDisabled,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: "easeInOut", duration: 0.15 }}
              className="fixed inset-0 z-20 transition ease-in-out bg-opacity-75 bg-neutral-500"
              aria-hidden="true"
              onClick={onToggle}
            />

            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ ease: "easeInOut", duration: 0.15 }}
              className="relative z-40 inline-block px-8 py-10 overflow-visible text-left align-bottom transform bg-white border border-black rounded-lg shadow-2xl border-opacity-5 sm:my-8 sm:w-full sm:max-w-xl sm:align-middle"
            >
              <div className="absolute top-0 right-0 hidden p-8 sm:block">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggle();
                  }}
                  type="button"
                  className="transition bg-white rounded-md text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>

                  <svg
                    className="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                {type === "info" ? (
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 p-3 mx-auto rounded-full bg-neutral-100 text-neutral-800 sm:mx-0 sm:h-12 sm:w-12">
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      {icon ?? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto rounded-lg bg-red-50 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="w-6 h-6 text-red-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      {icon ?? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      )}
                    </svg>
                  </div>
                )}

                <div className="flex-1 mt-3 sm:ml-4 sm:mt-0 sm:text-left">
                  <div className={"mb-3"}>
                    <p className={"text-lg font-semibold text-neutral-800"}>
                      {title}
                    </p>
                    <p className={"text-sm text-neutral-500"}>{description}</p>
                  </div>
                  {children}
                </div>
              </div>
              {onAction && (
                <div
                  className={`${
                    children ? "mt-5" : ""
                  } sm:flex sm:flex-row-reverse`}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className={`${
                      type === "info"
                        ? "bg-neutral-800 focus:ring-neutral-800"
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    } inline-flex w-full justify-center rounded border border-transparent px-6 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                      isActionDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={onAction}
                    disabled={isActionDisabled}
                  >
                    {action ? action : "Confirm"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="inline-flex justify-center w-full px-6 py-2 mt-3 text-base font-medium bg-white border rounded border-neutral-300 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onToggle}
                  >
                    Cancel
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
