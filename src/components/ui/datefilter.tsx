// "use client";

// import { DateRangePicker } from "../../components/DatePicker";

// import { eachDayOfInterval, interval, subDays, subYears } from "date-fns";
// import React from "react";
// import { DateRange } from "react-day-picker";

// export const getPeriod = (
//   dateRange: DateRange | undefined,
//   value: "previous-period" | "last-year" | "no-comparison",
// ): DateRange | undefined => {
//   if (!dateRange) return undefined;
//   const from = dateRange.from;
//   const to = dateRange.to;
//   switch (value) {
//     case "previous-period":
//       let previousPeriodFrom;
//       let previousPeriodTo;
//       if (from && to) {
//         const datesInterval = interval(from, to);
//         const numberOfDaysBetween = eachDayOfInterval(datesInterval).length;
//         previousPeriodTo = subDays(from, 1);
//         previousPeriodFrom = subDays(previousPeriodTo, numberOfDaysBetween);
//       }
//       return { from: previousPeriodFrom, to: previousPeriodTo };
//     case "last-year":
//       let lastYearFrom;
//       let lastYearTo;
//       if (from) {
//         lastYearFrom = subYears(from, 1);
//       }
//       if (to) {
//         lastYearTo = subYears(to, 1);
//       }
//       return { from: lastYearFrom, to: lastYearTo };
//     case "no-comparison":
//       return undefined;
//   }
// };

// type FilterbarProps = {
//   maxDate?: Date;
//   minDate?: Date;
//   selectedDates: DateRange | undefined;
//   onDatesChange: (dates: DateRange | undefined) => void;
//   selectedPeriod: "previous-period" | "last-year" | "no-comparison";
//   onPeriodChange: (
//     period: "previous-period" | "last-year" | "no-comparison",
//   ) => void;
// };

// export default function Filterbar({
//   maxDate,
//   minDate,
//   selectedDates,
//   onDatesChange,
// }: FilterbarProps) {
//   // const handleApply = () => {
//   //   setSelectedCategories(tempSelectedCategories);
//   // };
//   return (
//     <div>
//       <DateRangePicker
//         value={selectedDates}
//         onChange={(dates) => {
//           console.log("Date picker changed:", dates); // Debugging log
//           onDatesChange(dates);
//         }}
//         className="w-full sm:w-fit"
//         toDate={maxDate}
//         fromDate={minDate}
//         align="start"
//       />
//     </div>
//   );
// }
