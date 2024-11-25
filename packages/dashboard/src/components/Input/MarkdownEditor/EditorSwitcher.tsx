import { CampaignCreateData } from "dashboard/src/lib/schemas/campaigns";
import { useFormContext } from "react-hook-form";
import { Modal } from "../../Overlay";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EmailEditor } from "./EmailEditor";
import HTMLEditor from "@monaco-editor/react";

type EditorSwitcherProps = {
  modeSwitcher: boolean;
};
export const EditorSwitcher = ({ modeSwitcher }: EditorSwitcherProps) => {
  const [confirmModal, setConfirmModal] = useState(false);

  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CampaignCreateData>();

  const mode = watch("style");

  return (
    <>
      <Modal
        title="Watch out!"
        isOpen={confirmModal}
        onToggle={() => setConfirmModal(false)}
        onAction={() => {
          if (mode === "PLUNK") {
            setValue("style", "HTML");
            setValue("emailJson", null);
          } else {
            setValue("style", "PLUNK");
          }
          setValue("body", "");
          setConfirmModal(false);
        }}
        type="danger"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-700">
            Are you sure you want to switch to{" "}
            {mode === "PLUNK" ? "HTML" : "the Plunk Editor"}? <br />
            This will clear your current content.
          </p>
        </div>
      </Modal>
      <div className="sm:col-span-6">
        {modeSwitcher && (
          <div className="my-3 flex w-full gap-3 rounded-lg bg-neutral-100 p-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                setConfirmModal(true);
              }}
              className={`w-full flex-1 rounded p-2 text-sm font-medium ${
                mode === "PLUNK" ? "bg-white" : "hover:bg-neutral-50"
              } transition ease-in-out`}
            >
              Plunk Editor
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setConfirmModal(true);
              }}
              className={`w-full flex-1 rounded p-2 text-sm font-medium ${
                mode === "HTML" ? "bg-white" : "hover:bg-neutral-50"
              } transition ease-in-out`}
            >
              HTML
            </button>
          </div>
        )}
        {mode === "PLUNK" ? (
          <EmailEditor
            htmlOnChange={(value) => {
              setValue("body", value);
            }}
            jsonValue={watch("emailJson") ?? undefined}
            jsonOnChange={(value) => {
              setValue("emailJson", value);
            }}
          />
        ) : (
          <div className="mb-3 grid gap-3 md:grid-cols-1">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Email Body
              </label>
              <div className="h-full mt-1">
                <HTMLEditor
                  height={400}
                  className="rounded border border-neutral-300"
                  language="html"
                  theme="vs-light"
                  value={watch("body")}
                  onChange={(value) => setValue("body", value ?? "")}
                  options={{
                    inlineSuggest: true,
                    fontSize: "12px",
                    formatOnType: true,
                    autoClosingBrackets: true,
                    minimap: {
                      enabled: false,
                    },
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Preview
              </label>

              <div
                className={"mt-1 h-full rounded border border-neutral-300 p-3"}
              >
                <div
                  className={"revert-tailwind"}
                  dangerouslySetInnerHTML={{
                    __html: watch("body"),
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {errors.body?.message && (
            <motion.p
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="mt-1 text-xs text-red-500"
            >
              {errors.body.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
