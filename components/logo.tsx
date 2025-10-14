import CaredLogo from "/chat/cared.svg?react";

export function Logo({ showWordMark }: { showWordMark?: boolean }) {
  return (
    <div className="flex transform cursor-pointer items-center gap-1.5 duration-100 ease-in-out">
      <CaredLogo className="size-6" />
      {showWordMark && <span className="font-medium text-base">Cared</span>}
    </div>
  );
}
