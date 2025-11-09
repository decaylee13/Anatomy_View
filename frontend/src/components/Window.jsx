import React from 'react';

// Placeholder asset paths - replace with actual Figma exports
const imgHeart = "/figma-assets/heart-image.jpg";
const imgBrain = "/figma-assets/brain-placeholder.png";
const imgSkeleton = "/figma-assets/skeleton-image.jpg";
const imgCubeLogo = "/figma-assets/cube-logo.svg";
const imgVector = "/figma-assets/search-icon.svg";
const imgVector1 = "/figma-assets/dropdown-icon.svg";
const imgVector2 = "/figma-assets/filter-icon.svg";
const imgOpenModel = "/figma-assets/heart-icon.svg"; // Actually the open model icon
const imgProfile = "/figma-assets/checkmark-icon.svg"; // Actually the profile icon

export default function Window() {
  return (
    <div className="min-h-screen w-full bg-[#fbffff]" data-name="Window" data-node-id="1:2898">
      {/* Header/Navigation Bar */}
      <div className="bg-gradient-to-r from-[#171738] to-[#000501] h-[94px] w-full flex items-center px-6 gap-6">
        {/* Tab */}
        <div className="bg-[#171738] border-2 border-[#27274c] h-[52px] rounded-tl-[15px] rounded-tr-[24px] rounded-bl-[24px] rounded-br-[15px] px-6 flex items-center justify-center gap-2 min-w-[186px]">
          <img src={imgCubeLogo} alt="Logo" className="w-6 h-6" />
          <span className="text-white font-bold text-[17px]">Learnability</span>
        </div>
        
        {/* Menu Bar */}
        <div className="bg-[#171738] border-2 border-[#27274c] h-[52px] rounded-[24px] px-6 flex items-center gap-8">
          <button className="text-white font-bold text-[17px]">Home</button>
          <button className="text-white font-bold text-[17px]">Models</button>
          <button className="text-white font-bold text-[17px]">Upload</button>
          <button className="text-white font-bold text-[17px]">Support</button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#f0f4f4] h-[65px] mx-[61px] mt-[52px] rounded-[15px] shadow-[0px_0px_5px_rgba(0,0,0,0.19)] flex items-center px-[34px] gap-[21px]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-[346px]">
          <div className="bg-[#f0f4f4] h-[40px] rounded-[40px] flex items-center px-5 gap-3" style={{ boxShadow: 'inset 0px 0px 8px rgba(0,0,0,0.3)' }}>
            <img src={imgVector} alt="Search" className="w-[18px] h-[18px] opacity-70" />
            <input 
              type="text" 
              placeholder="Search for a model or author" 
              className="bg-transparent flex-1 text-[17px] text-[#686b7e] italic placeholder:text-[#686b7e] outline-none"
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="bg-[#f0f4f4] h-[40px] rounded-[40px] shadow-[0px_0px_4px_rgba(0,0,0,0.2)] px-5 flex items-center gap-3 min-w-[182px] cursor-pointer">
          <span className="text-[#686b7e] text-[17px] flex-1">All categories</span>
          <img src={imgVector1} alt="Dropdown" className="w-[10px] h-[6px] opacity-70" />
        </div>

        {/* Filters Button */}
        <div className="bg-[#f0f4f4] h-[40px] rounded-[40px] shadow-[0px_0px_4px_rgba(0,0,0,0.2)] px-5 flex items-center gap-3 min-w-[115px] cursor-pointer">
          <span className="text-[#686b7e] text-[17px]">Filters</span>
          <img src={imgVector2} alt="Filter" className="w-[14px] h-[14px] opacity-70" />
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="px-[61px] py-[52px] flex gap-[45px]">
        {/* Card 1 */}
        <div className="bg-[#f0f4f4] rounded-[15px] shadow-[0px_0px_5px_rgba(0,0,0,0.19)] w-[302px] h-[315px] p-6 flex flex-col">
          <div className="relative flex-1 mb-4 overflow-hidden">
            <img 
              src={imgHeart} 
              alt="Human Heart" 
              className="w-full h-[202px] object-cover object-center rounded-[10px]"
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-[#000501] text-[17px] font-normal">Human Heart</h3>
              <div className="flex items-center gap-2 mt-1">
                <img src={imgProfile} alt="Author" className="w-[14px] h-[14px] opacity-60" />
                <p className="text-[#686b7e] text-[12px]">Education Resource Fund</p>
              </div>
            </div>
            <button className="bg-[#4c9ae7] rounded-[13px] w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 hover:bg-[#3d8ed6] transition">
              <img src={imgOpenModel} alt="Open" className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#f0f4f4] rounded-[15px] shadow-[0px_0px_5px_rgba(0,0,0,0.19)] w-[302px] h-[315px] p-6 flex flex-col">
          <div className="relative flex-1 mb-4 overflow-hidden">
            <img 
              src={imgSkeleton} 
              alt="Human Skeleton" 
              className="w-full h-[202px] object-cover object-center rounded-[10px]"
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-[#000501] text-[17px] font-normal">Human Skeleton</h3>
              <div className="flex items-center gap-2 mt-1">
                <img src={imgProfile} alt="Author" className="w-[14px] h-[14px] opacity-60" />
                <p className="text-[#686b7e] text-[12px]">vegu</p>
              </div>
            </div>
            <button className="bg-[#4c9ae7] rounded-[13px] w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 hover:bg-[#3d8ed6] transition">
              <img src={imgOpenModel} alt="Open" className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#f0f4f4] rounded-[15px] shadow-[0px_0px_5px_rgba(0,0,0,0.19)] w-[302px] h-[315px] p-6 flex flex-col">
          <div className="relative flex-1 mb-4">
            <img 
              src={imgBrain} 
              alt="Human Brain" 
              className="w-full h-[202px] object-cover rounded-[10px]"
            />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-[#000501] text-[17px] font-normal">Human Brain</h3>
              <div className="flex items-center gap-2 mt-1">
                <img src={imgProfile} alt="Author" className="w-[14px] h-[14px] opacity-60" />
                <p className="text-[#686b7e] text-[12px]">Education Resource Fund</p>
              </div>
            </div>
            <button className="bg-[#4c9ae7] rounded-[13px] w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 hover:bg-[#3d8ed6] transition">
              <img src={imgOpenModel} alt="Open" className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
