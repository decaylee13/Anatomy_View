import Window from './Window';

/**
 * WindowPage - A standalone page component to preview the Figma design
 * This component is separate from the main 3D heart viewer app
 */
export default function WindowPage() {
  return (
    <div className="h-screen w-screen overflow-auto bg-[#fbffff]">
      <Window />
    </div>
  );
}
