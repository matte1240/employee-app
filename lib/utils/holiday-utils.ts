import Holidays from 'date-holidays';

const hd = new Holidays('IT');

export type Holiday = {
  date: string;
  start: Date;
  end: Date;
  name: string;
  type: string;
};

export function getHolidays(year: number): Holiday[] {
  return hd.getHolidays(year);
}

export function isHoliday(date: Date | string): boolean {
  return !!hd.isHoliday(date);
}

export function getHolidayName(date: Date | string): string | undefined {
  const holiday = hd.isHoliday(date);
  if (holiday) {
    // date-holidays returns an array of holidays or false/undefined
    // but the type definition says it returns Holiday | false
    // Let's handle the return type safely
    if (Array.isArray(holiday)) {
        return holiday[0].name;
    }
    return (holiday as any).name;
  }
  return undefined;
}
