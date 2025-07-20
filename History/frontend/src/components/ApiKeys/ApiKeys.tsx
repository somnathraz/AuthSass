"use client"
import React,{useState} from 'react'
import { useAppStore } from '@/store/appStore';
import DialogModal from '@/components/ DialogModal/DialogModal';


const ApiKeys = () => {
    const { selectedAppId } = useAppStore();
    const [open, setOpen] = useState(false);
  
   
  
    if (!selectedAppId) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 px-4">
          <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
            Create Your First App
          </h1>
          <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
            Get started by creating your first application.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none"
          >
            Create First App
          </button>
  
          <DialogModal
            open={open}
            setOpen={setOpen}
           
          />
        </div>
      );
    }
  
  return (
    <div>ApiKeys</div>
  )
}

export default ApiKeys