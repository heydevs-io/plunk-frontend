import { type ChangeEvent, useState, type DragEvent } from "react";
import Modal from "../Overlay/Modal/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { UploadIcon, DownloadIcon } from "lucide-react";
import axios from "axios";
import { API_URI } from "dashboard/src/lib/constants";
import { useActiveProject } from "dashboard/src/lib/hooks/projects";
import { toast } from "sonner";

export const UploadFile = () => {
  // State management for file upload process
  const project = useActiveProject();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Validate that the selected file is a CSV
  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return false;
    }
    setError(null);
    return true;
  };

  // Handle the file upload process
  const startUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send POST request to upload the file
      await axios.post("v1/contacts/import", formData, {
        baseURL: API_URI,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: project?.secret && `Bearer ${project.secret}`,
          withCredentials: true,
        },
        // Update progress as file uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      // Handle successful upload
      toast.success("File uploaded successfully");
      setIsUploading(false);
      setUploadProgress(100);

      // Close the modal after a short delay
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(null);
      }, 1500); // 1.5 seconds delay
    } catch (error) {
      // Handle upload error
      console.error("Error uploading file:", error);
      toast.error("Error uploading file");
      setError("An error occurred while uploading the file.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle file selection via input
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        startUpload(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  // Handle drag and drop functionality
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        startUpload(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  // Toggle the upload modal
  const toggleModal = () => {
    if (!isUploading) {
      setIsModalOpen(!isModalOpen);
      setError(null);
      setSelectedFile(null);
      setUploadProgress(null);
    }
  };

  return (
    <div>
      {/* Upload button to open modal */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleModal}
        className="flex items-center px-4 py-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-500"
      >
        <UploadIcon strokeWidth={1.5} size={18} className="mr-2" />
        Upload CSV File
      </motion.button>

      {/* Modal for file upload */}
      <Modal
        isOpen={isModalOpen}
        onToggle={toggleModal}
        title="Upload CSV File"
        description="Please upload a CSV file containing your data"
        type="info"
      >
        {/* Warning message during upload */}
        {isUploading && (
          <p className="mb-4 text-sm text-yellow-600">
            Please wait for the upload to complete before closing this window.
          </p>
        )}

        {/* Download template section */}
        <div className="flex flex-col items-center mb-6">
          <motion.a
            href="https://ai-codelight.s3.amazonaws.com/cdn/contact_template.csv"
            download
            className="flex items-center justify-center px-4 py-2 mb-2 text-sm font-medium text-center text-white bg-green-700 rounded-md cursor-pointer hover:bg-green-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <DownloadIcon strokeWidth={1.5} size={18} className="mr-2" />
            Download Template
          </motion.a>
          <p className="text-sm text-center text-gray-600">
            Please download the template here.
          </p>
        </div>

        {/* Drag and drop area */}
        <motion.div
          className={`p-6 mt-4 border-2 border-dashed rounded-lg ${
            isDragging ? "border-green-600 bg-green-50" : "border-gray-300"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <p className="mb-2 text-center text-gray-500">
            Drag and drop your CSV file here, or click to select
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
            id="fileInput"
          />
          <div className="flex justify-center">
            <motion.label
              htmlFor="fileInput"
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-md cursor-pointer hover:bg-green-500"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UploadIcon strokeWidth={1.5} size={18} className="mr-2" />
              Select CSV File
            </motion.label>
          </div>

          {/* Display selected file or error message */}
          <AnimatePresence>
            {selectedFile && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-center text-green-600"
              >
                Selected file: {selectedFile.name}
              </motion.p>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-center text-red-600"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="mt-4 text-xs text-center text-gray-400">
            Accepted file type: CSV (Comma-Separated Values)
          </p>
        </motion.div>

        {/* Upload progress bar */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4"
            >
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-neutral-800 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="mt-2 text-sm text-center">
                {uploadProgress < 100
                  ? `Uploading: ${uploadProgress}%`
                  : "Upload complete!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </div>
  );
};
