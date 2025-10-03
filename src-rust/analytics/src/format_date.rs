use std::time::{Duration, UNIX_EPOCH};

pub fn get_yyyymmdd(timestamp_millis: i64, offset: i32) -> Result<String, String> {
    let timestamp_with_offset = if offset >= 0 {
        UNIX_EPOCH
            + Duration::from_millis(timestamp_millis as u64)
            + Duration::from_secs((offset as u64) * 60)
    } else {
        UNIX_EPOCH + Duration::from_millis(timestamp_millis as u64)
            - Duration::from_secs((-offset as u64) * 60)
    };

    let mut days = timestamp_with_offset
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        / 86400;
    let mut year = 1970;

    while days >= 365 + is_leap_year(year) as u64 {
        days -= 365 + is_leap_year(year) as u64;
        year += 1;
    }

    let month_days: [u64; 12] = [
        31,
        28 + is_leap_year(year) as u64,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut month = 0;

    while days >= month_days[month] {
        days -= month_days[month];
        month += 1;
    }

    Ok(format!("{:04}-{:02}-{:02}", year, month + 1, days + 1))
}

fn is_leap_year(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

#[cfg(test)]
mod tests {
    use super::get_yyyymmdd;

    #[test]
    fn unix_epoch() {
        assert_eq!(get_yyyymmdd(0, 0).unwrap(), "1970-01-01");
    }

    #[test]
    fn simple_date() {
        assert_eq!(get_yyyymmdd(1_577_836_800_000, 0).unwrap(), "2020-01-01");
    }

    #[test]
    fn leap_year() {
        assert_eq!(get_yyyymmdd(1_709_164_800_000, 0).unwrap(), "2024-02-29");
    }

    #[test]
    fn end_of_year() {
        assert_eq!(get_yyyymmdd(1_672_444_800_000, 0).unwrap(), "2022-12-31");
    }

    #[test]
    fn with_offset() {
        assert_eq!(get_yyyymmdd(3_600_000, 60).unwrap(), "1970-01-01");
    }

    #[test]
    fn end_of_first_day() {
        assert_eq!(get_yyyymmdd(86_399_000, 0).unwrap(), "1970-01-01");
    }

    #[test]
    fn start_of_second_day() {
        assert_eq!(get_yyyymmdd(86_400_000, 0).unwrap(), "1970-01-02");
    }

    #[test]
    fn second_day_with_offset() {
        assert_eq!(get_yyyymmdd(82_800_000, 120).unwrap(), "1970-01-02");
    }
}
