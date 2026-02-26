import {
  ClipboardPen,
  ReceiptText,
  CircleCheckBig,
  Building,
  // FileDown,
} from "lucide-react";

import Link from "next/link";

export default function Rightside() {
  return (
    <>
      <div className="flex flex-col h-full px-12 py-12">
        <div className="w-full font-semibold text-sm sm:text-lg bg-[#fbbf23] py-4 px-4 rounded-xl">
          Quick Access Modules
        </div>
        <div className="w-full mt-[4vh] flex gap-5 flex-col text-white font-semibold text-sm sm:text-lg ">
          <Link href="/renew">
            <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30">
              <ReceiptText /> Renew Certificate
            </div>
          </Link>
          <Link href="/verify">
            <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30">
              <CircleCheckBig /> Verify Certificate
            </div>
          </Link>
        </div>

        <div className="sm:mt-[14vh] flex flex-col gap-5 py-7">
          <div className="w-full font-semibold text-sm sm:text-lg text-white py-4 px-4 rounded-xl">
            Click here for
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-white font-semibold text-sm sm:text-lg">
            <Link href="/newregistration">
              <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30 ">
                <ClipboardPen /> New School Registration
              </div>
            </Link>
            <Link href="/onboard">
              <div className="flex items-center gap-5 bg-white/20 rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30 ">
                <Building /> Existing School Onboarding
              </div>
            </Link>
          </div>
          {/* <a href="/Application-form.pdf" download>
            <div className="flex items-center gap-5 bg-white/20 text-white rounded-xl border border-white py-4 px-4 cursor-pointer hover:bg-white/30">
              <FileDown /> Download Application Form
            </div>
          </a> */}
        </div>
      </div>
    </>
  );
}
