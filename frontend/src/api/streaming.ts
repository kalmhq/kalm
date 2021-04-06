import { getObjectListRequestUrl } from "api";
import { StreamingEventType } from "../types";

export const parseFirstTimeStreamingData = (data: string) => {
  const items = data.split("}\n{");

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

export const parseStreamingData = <T>(dataString: string) => {
  const data: { type: StreamingEventType; object: T } = JSON.parse(dataString);
  return data;
};

export const watchResourceList = async <T>(kind: string, onData: (type: StreamingEventType, object: T) => void) => {
  // use raw xhr here. Will migrate to axios if this issue is fixed
  // https://github.com/axios/axios/issues/479

  // TODO: reconnect if the connection is broken
  // TODO: close xhr if the above component is unmounted

  const url = await getObjectListRequestUrl({ kind, metadata: { name: "" } });

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
        last_index = curr_index;

        parseFirstTimeStreamingData(s).forEach((item) => {
          const data = parseStreamingData<T>(item);
          onData(data.type, data.object);
        });

        return;
      }

      last_index = curr_index;
      const data = parseStreamingData<T>(s);
      onData(data.type, data.object);
    };

    xhr.onerror = () => {
      setTimeout(makeRequest, 3000);
    };

    xhr.send();
  };

  makeRequest();
};
