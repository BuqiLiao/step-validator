import { isValidUrl, isValidString } from "../dist/index.js";

// 示例 URL 和配置
const url = "http://example.com/";
const config = {
  protocol_config: {
    required: false
  },
  host_config: {
    required: false,
    blacklist: {
      contains: [".."],
      end_with: ["/"]
    }
  },
  query_key_config: {
    allowed: false
  },
  fragment_config: {
    allowed: false
  }
};

const result = isValidUrl(url, config);
console.log(
  isValidString("http://example.com/", "String", {
    required: false,
    blacklist: {
      contains: [".."],
      end_with: ["/"]
    }
  })
);
// console.log(result);
