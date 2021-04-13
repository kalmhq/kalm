import { getObjectListRequestUrl } from "api";
import { Resources, StreamingEventType } from "../types";

const parseFirstTimeStreamingData = (data: string) => {
  const items = data.split("}\n{");

  if (items.length === 1) {
    return items;
  }

  return items.map((item, i) => {
    if (i === 0) {
      item = item + "}";
    } else if (i === items.length - 1) {
      item = "{" + item;
    } else {
      item = "{" + item + "}";
    }

    return item;
  });
};

const parseStreamingData = <T>(dataString: string) => {
  const data: { type: StreamingEventType; object: T } = JSON.parse(dataString);
  return data;
};

export const watchResourceList = async <T = Resources>(
  kind: string,
  onData: (type: StreamingEventType, object: T) => void,
) => {
  // use raw xhr here. Will migrate to axios if this issue is fixed
  // https://github.com/axios/axios/issues/479

  let lastXHR: XMLHttpRequest;

  const url = await getObjectListRequestUrl({ kind, apiVersion: "", metadata: { name: "" } });

  const makeRequest = () => {
    var last_index = 0;
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url + "?watch=true", true);

    xhr.onprogress = () => {
      var curr_index = xhr.responseText.length;
      if (last_index === curr_index) return;

      var s = xhr.responseText.substring(last_index, curr_index);

      // first time data
      if (last_index === 0) {
        // the first batch is not a complete batch, do not parse, wait fot the next chunk
        if (xhr.responseText.substring(curr_index - 1) !== "\n") {
          return;
        }

        last_index = curr_index;

        parseFirstTimeStreamingData(s).forEach((item) => {
          const data = parseStreamingData<T>(item);
          onData(data.type, data.object);
        });

        return;
      }

      try {
        const data = parseStreamingData<T>(s);
        onData(data.type, data.object);
        last_index = curr_index;
      } catch (e) {}
    };

    xhr.onerror = () => {
      setTimeout(makeRequest, 3000);
    };

    xhr.send();

    return xhr;
  };

  lastXHR = makeRequest();

  return () => {
    lastXHR.abort();
  };
};
