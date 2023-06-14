/* 
const inputDate1 = "2023-05-11T15:49:00.000Z";
const formattedDate1 = formatDateToCustomFormat(inputDate1);
console.log(formattedDate1); // Output: "May 11, 2023"

const inputDate2 = "2022-02-08T08:30:00.000Z";
const formattedDate2 = formatDateToCustomFormat(inputDate2);
console.log(formattedDate2); // Output: "Feb 8, 2022" 
*/
export const formatDateToCustomFormat = (dateString: string): string => {
  const originalDate = new Date(dateString);
  const formattedDate = originalDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return formattedDate;
};
