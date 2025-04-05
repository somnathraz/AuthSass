import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface DialogModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
 
}

const DialogModal: React.FC<DialogModalProps> = ({ open, setOpen,  }) => {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appName = formData.get("appName");
    const appDescription = formData.get("appDescription");

    // TODO: Add your API call or mutation to create the app
    console.log("Creating new app:", { appName, appDescription });
    alert(`Successfully created new app: ${appName}`);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hidden" />
      </DialogTrigger>
      <DialogContent className="fixed z-[999999] top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white text-black p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create App
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Fill out the form below to create your first app.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium mb-1">
              App Name
            </label>
            <input
              id="appName"
              name="appName"
              type="text"
              required
              placeholder="Enter app name"
              className="w-full border-[1px] border-gray-300 rounded-md p-2 text-sm bg-white text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="appDescription" className="block text-sm font-medium mb-1">
              App Description
            </label>
            <textarea
              id="appDescription"
              name="appDescription"
              rows={3}
              placeholder="Enter a brief description"
              className="w-full border-[1px] border-gray-300 rounded-md p-2 text-sm bg-white text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <DialogClose
              type="button"
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </DialogClose>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              Continue
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DialogModal;
