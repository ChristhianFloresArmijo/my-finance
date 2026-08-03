import { TTimeStamp, CommonTimeStamps } from "@shared/business/types/common"

export class TimeStamp {
  private constructor(public readonly value: Date | null) {}

  public static create(value?: TTimeStamp): TimeStamp {
    if (value === undefined) {
      return new TimeStamp(new Date())
    }

    if (value === null) {
      return new TimeStamp(null)
    }

    const date = new Date(value)

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format")
    }

    return new TimeStamp(date)
  }

  public static createCommonTimestamps(data: Partial<CommonTimeStamps>): {
    created_at: TimeStamp
    updated_at: TimeStamp
    deleted_at: TimeStamp | null
  } {
    const now = TimeStamp.now()

    return {
      created_at: data.created_at ? TimeStamp.create(data.created_at) : now,
      updated_at: data.updated_at ? TimeStamp.create(data.updated_at) : now,
      deleted_at: data.deleted_at ? TimeStamp.create(data.deleted_at) : TimeStamp.create(null),
    }
  }

  public static now(): TimeStamp {
    return new TimeStamp(new Date())
  }

  public static fromISOString(isoString: string): TimeStamp {
    return TimeStamp.create(isoString)
  }

  public getValue(): Date {
    return this.value
  }

  public toString(): string {
    return this.value.toISOString()
  }

  public isBefore(other: TimeStamp): boolean {
    return this.value < other.value
  }

  public isAfter(other: TimeStamp): boolean {
    return this.value > other.value
  }

  public isEqual(other: TimeStamp): boolean {
    return this.value.getTime() === other.value.getTime()
  }

  public addDays(days: number): TimeStamp {
    const newDate = new Date(this.value)
    newDate.setDate(newDate.getDate() + days)
    return new TimeStamp(newDate)
  }

  public addHours(hours: number): TimeStamp {
    const newDate = new Date(this.value)
    newDate.setHours(newDate.getHours() + hours)
    return new TimeStamp(newDate)
  }

  public addMinutes(minutes: number): TimeStamp {
    const newDate = new Date(this.value)
    newDate.setMinutes(newDate.getMinutes() + minutes)
    return new TimeStamp(newDate)
  }

  public toJSON(): string {
    return this.toString()
  }
}
