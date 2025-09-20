pub fn parse_url(url: &str) -> Result<(String, Option<u16>, String, String, String), String> {
    let url = if url.contains("://") {
        url.into()
    } else {
        format!("http://{}", url)
    };

    let after_scheme = url
        .splitn(2, "://")
        .nth(1)
        .ok_or("Invalid URL: missing scheme")?;

    let host_end_idx = after_scheme
        .find(|c| c == '/' || c == '?' || c == '#')
        .unwrap_or_else(|| after_scheme.len());

    let host_port = &after_scheme[..host_end_idx];
    if host_port.is_empty() {
        return Err("Invalid URL: missing host".into());
    }

    let (host, port) = if let Some((h, p)) = host_port.split_once(':') {
        if h.is_empty() {
            return Err("Invalid URL: missing host".into());
        }
        let port: u16 = p.parse().map_err(|_| "Invalid port number")?;
        (h, Some(port))
    } else {
        (host_port, None)
    };

    let rest = &after_scheme[host_end_idx..];

    let (rest, fragment) = match rest.find('#') {
        Some(idx) => (&rest[..idx], &rest[idx + 1..]),
        None => (rest, ""),
    };

    let (path, query) = match rest.find('?') {
        Some(idx) => (&rest[..idx], &rest[idx + 1..]),
        None => (rest, ""),
    };

    let path = if path.is_empty() {
        "/".into()
    } else {
        path.into()
    };

    Ok((host.into(), port, path, query.into(), fragment.into()))
}

#[cfg(test)]
mod tests {
    use super::parse_url;

    #[test]
    fn full_url_with_port_query_fragment() {
        assert_eq!(
            parse_url("https://example.com:8080/path/to/resource?query=1#frag").unwrap(),
            (
                "example.com".to_string(),
                Some(8080),
                "/path/to/resource".to_string(),
                "query=1".to_string(),
                "frag".to_string()
            )
        );
    }

    #[test]
    fn url_with_port() {
        assert_eq!(
            parse_url("http://example.com:3000").unwrap(),
            (
                "example.com".to_string(),
                Some(3000),
                "/".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_without_port() {
        assert_eq!(
            parse_url("example.com/path").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/path".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_with_query() {
        assert_eq!(
            parse_url("http://example.com/?a=1&b=2").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "a=1&b=2".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_with_fragment() {
        assert_eq!(
            parse_url("http://example.com/#section").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "".to_string(),
                "section".to_string()
            )
        );
    }

    #[test]
    fn root_path() {
        assert_eq!(
            parse_url("http://example.com/").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn missing_host() {
        assert!(parse_url("http://").is_err());
    }

    #[test]
    fn invalid_port() {
        assert!(parse_url("http://example.com:abc/").is_err());
    }

    #[test]
    fn host_and_port_no_path() {
        assert_eq!(
            parse_url("example.com:1234").unwrap(),
            (
                "example.com".to_string(),
                Some(1234),
                "/".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn empty_path_with_query_and_fragment() {
        assert_eq!(
            parse_url("example.com?foo=bar#section1").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "foo=bar".to_string(),
                "section1".to_string()
            )
        );
    }

    #[test]
    fn multiple_slashes() {
        assert_eq!(
            parse_url("http://example.com/path/to//resource").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/path/to//resource".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_with_only_fragment() {
        assert_eq!(
            parse_url("example.com#top").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "".to_string(),
                "top".to_string()
            )
        );
    }

    #[test]
    fn url_with_only_query() {
        assert_eq!(
            parse_url("example.com?search=rust").unwrap(),
            (
                "example.com".to_string(),
                None,
                "/".to_string(),
                "search=rust".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_with_empty_host() {
        assert!(parse_url("http://:8080/path").is_err());
    }

    #[test]
    fn url_with_port_but_no_host() {
        assert!(parse_url("http://:3000").is_err());
    }

    #[test]
    fn url_with_zero_port() {
        assert_eq!(
            parse_url("example.com:0/path").unwrap(),
            (
                "example.com".to_string(),
                Some(0),
                "/path".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }

    #[test]
    fn url_with_max_port() {
        assert_eq!(
            parse_url("example.com:65535/path").unwrap(),
            (
                "example.com".to_string(),
                Some(65535),
                "/path".to_string(),
                "".to_string(),
                "".to_string()
            )
        );
    }
}
