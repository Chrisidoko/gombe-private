import Image from "next/image";
import Link from "next/link";

export default function VerificationSuccess() {
  return (
    <div
      // 1. Outer Container: Sets the screen height and holds the background image.
      // We use 'relative' so the absolutely positioned overlay respects these bounds.
      className="relative flex flex-col items-center justify-center min-h-screen text-center"
      style={{
        backgroundImage: "url('/kano.png')",
        backgroundSize: "cover", // Changed from '100%' to 'cover' for better responsiveness
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 2. Overlay Layer: This is the semi-transparent black film. */}
      <div className="absolute inset-0 bg-black/70"></div>
      {/* 'inset-0' is a Tailwind shortcut for: top: 0, right: 0, bottom: 0, left: 0. 
      'bg-black/70' sets the black color with 70% opacity. Adjust the number (70) as needed. */}

      {/* 3. Content Container: This is your white box, placed on top. */}
      <div className="relative z-10 p-8 md:p-12 bg-white rounded-xl shadow-2xl max-w-sm md:max-w-lg w-full m-4">
        <Image
          src="/kirs.png"
          alt="Logo"
          className="mx-auto"
          width={76}
          height={76}
        />

        <h2 className="mt-4 text-2xl font-bold mb-4 text-gray-800">
          Account Verified
        </h2>
        <p className="text-gray-600">
          Your school operations account has been successfully approved.
        </p>
        {/* Your verification form/info goes here */}
        <Link href="/">
          <button className="mt-6 w-full py-2 bg-[#28a745] text-white font-semibold rounded-lg hover:bg-[#28a745]/80 transition cursor-pointer">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
//  The school operator account has been successfully approved.
