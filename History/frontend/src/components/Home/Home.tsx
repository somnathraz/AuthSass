"use client";

import React, { useState } from "react";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import { useAppStore } from "@/store/appStore";
import DialogModal from "../ DialogModal/DialogModal";


const Home: React.FC = () => {
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
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
      <div className="col-span-12">
        <StatisticsChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
};

export default Home;
