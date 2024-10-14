import { DotSpinner } from "@uiball/loaders";
import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import ReactEmailEditor, {
  type EditorRef,
  type EmailEditorProps,
} from "react-email-editor";
import { toast } from "sonner";

/**
 * Props for the EmailEditor component.
 */
type Props = {
  /**
   * A callback that is called whenever the HTML value of the editor changes.
   * @param htmlValue The new HTML value of the editor.
   */
  htmlOnChange: (htmlValue: string) => void;

  /**
   * The current JSON value of the editor.
   */
  jsonValue: Record<string, unknown> | string | undefined;
  /**
   * A callback that is called whenever the JSON value of the editor changes.
   * @param jsonValue The new JSON value of the editor.
   */
  jsonOnChange: (jsonValue: Record<string, unknown> | string) => void;
};

export const EmailEditor = ({
  htmlOnChange,
  jsonValue,
  jsonOnChange,
}: Props) => {
  const emailEditorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(true);

  const exportHtml = () => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.exportHtml(({ html }) => {
      navigator.clipboard
        .writeText(html) // Copy HTML to clipboard
        .then(() => {
          toast.info("HTML copied to clipboard!"); // Use toast for success message
        })
        .catch((err) => {
          toast.error("Failed to copy HTML: ", err); // Optional: Log error
        });
    });
  };

  /**
   * Called whenever the user makes a change to the design.
   * The callback calls {@link htmlOnChange} with the new HTML value of the editor
   * and {@link jsonOnChange} with the new JSON value of the editor.
   */
  const onDesignChange = useCallback(() => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.exportHtml(({ html }) => {
      htmlOnChange(html);
    });

    unlayer?.saveDesign((design: Record<string, unknown>) => {
      jsonOnChange(design);
    });
  }, [htmlOnChange, jsonOnChange]);

  const onLoad: EmailEditorProps["onLoad"] = (unlayer) => {
    // unlayer.registerCallback(
    //   "image",
    //   async (
    //     file: { attachments: Array<{ name: string }> },
    //     done: (result: { blob: Blob | null; mime: string }) => void
    //   ) => {

    //     try {
    //       const body = {
    //         fileName: file.attachments[0].name,
    //         category: "JOB",
    //       };

    //       // console.log("🚀 ~ unlayer.registerCallback ~ body:", body);

    //       const response = await network.fetch(
    //         "POST",
    //         "https://dev.api.tscout.ai/uploader/sign-url",
    //         body
    //       );
    //       console.log("🚀 ~ unlayer.registerCallback ~ response:", response);

    //       // const response = await fetch(file.url);
    //       // const blob = await response.blob();
    //       // done({ blob, mime: file.mime });
    //     } catch (error) {
    //       // console.error(error);
    //       // done({ blob: null, mime: file.mime });
    //     }
    //   }
    // );

    if (jsonValue) {
      // @ts-expect-error: Unlayer's typing is not very good
      unlayer.loadDesign(jsonValue);
    }
  };

  /**
   * Callback function called when the email editor is ready.
   * It adds an event listener for the "design:updated" event,
   * which triggers the onDesignChange function when the design is modified.
   *
   * @param unlayer - The unlayer object provided by the email editor
   */
  const onReady: EmailEditorProps["onReady"] = (unlayer) => {
    setLoading(false);
    unlayer.addEventListener("design:updated", onDesignChange);
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <DotSpinner size={40} color="#4A90E2" />
        </div>
      )}
      <label
        htmlFor="editor"
        className="block text-sm font-medium text-neutral-700"
      >
        Email Body
      </label>
      <div className="flex justify-end gap-4 mr-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          className="px-8 py-2 text-sm font-medium text-center text-white rounded bg-neutral-800"
          onClick={exportHtml}
          disabled={loading}
        >
          Copy HTML
        </motion.button>
      </div>

      <ReactEmailEditor
        ref={emailEditorRef}
        minHeight={1000}
        options={{
          displayMode: "email",
        }}
        onLoad={onLoad}
        onReady={onReady}
        style={{
          overflowX: "auto",
        }}
      />
    </div>
  );
};
