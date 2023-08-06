
1. Create a virtual environemnt "python -m venv zoo-eoapi-venv"
2. Install these pacakges:
python -m pip install pip -U
python -m pip install pystac
python -m pip install pypgstac==0.7.9 psycopg[binary,pool]
python -m pip install folium #you need it later in the demos
3. Run a Jupyter Notebook in your Venv: https://stackoverflow.com/questions/33496350/execute-python-script-within-jupyter-notebook-using-a-specific-virtualenv?rq=3
    * Start the notebook in a dedicated bash/cmd
4. Get list of images

```bash
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=1 | jq '.results[]' -c > oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=2 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=3 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=4 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=5 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=6 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=7 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=8 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=9 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=10 | jq '.results[]' -c >> oam.njson
curl https://api.openaerialmap.org/meta\?limit\=1000\&page\=11 | jq '.results[]' -c >> oam.njson
```

5. Create items

```python
import pystac
import json

from pystac.utils import datetime_to_str, str_to_datetime


with open("oam.njson", "r") as fin:
    with open("oam_items.njson", "w") as fout:
        for line in fin.readlines():
            try:
                itm = json.loads(line)
                item = pystac.Item(
                    id=itm["_id"],
                    geometry=itm["geojson"],
                    bbox=itm["bbox"],
                    collection="openaerialmap",
                    stac_extensions=[],
                    datetime=None,
                    properties={
                        "title": itm["title"],
                        "platform": itm["platform"],
                        "provider": itm["provider"],
                        "contact": itm["contact"],
                        "start_datetime": datetime_to_str(str_to_datetime(itm['acquisition_start'])),
                        "end_datetime": datetime_to_str(str_to_datetime(itm['acquisition_end'])),
                    },
                )

                item.add_link(
                    pystac.Link(
                        pystac.RelType.COLLECTION,
                        "openaerialmap",
                        media_type=pystac.MediaType.JSON,
                    )
                )

                item.add_asset(
                    key="image",
                    asset=pystac.Asset(href=itm["uuid"], media_type=pystac.MediaType.COG),
                )
                # Here we make sure to remove any invalid character
                fout.write(json.dumps(item.to_dict(), ensure_ascii=False).encode("ascii", "ignore").decode("utf-8").replace('\\"', "") + "\n")
            except:
                continue
```

Note: You may want to remove really old imagery (e.g the one from 1949) to avoid creating partition for only one image.

6. create oam_collection.json
```json
{"id": "openaerialmap", "title": "OpenAerialMap", "description": "OpenAerialMap Dataset", "stac_version": "1.0.0", "license": "public-domain", "links": [], "extent": {"spatial": {"bbox": [[-180, -90, 180, 90]]}, "temporal": {"interval": [["1944-12-31T13:00:00.000Z", "null"]]}}}
```

Note: the json must be in form of NewLine delimited (one item/collection per line).

7. upload collection and items to the RDS postgres instance (using pypgstac)


```bash
$ pypgstac pgready --dsn postgresql://username:password@127.0.0.1:5439/postgis #og was 0.0.0.0

# $ pypgstac load collections oam_collection.json --dsn postgresql://{db-user}:{db-password}@{db-host}:{db-port}/{db-name} --method insert
pypgstac load collections oam_collection.json --dsn postgresql://username:password@127.0.0.1:5439/postgis

# $ pypgstac load items oam_items.njson --dsn postgresql://{db-user}:{db-password}@{db-host}:{db-port}/{db-name} --method insert
pypgstac load items oam_items.njson --dsn postgresql://username:password@127.0.0.1:5439/postgis

```


Note:

- You may have to add you address IP to the VPC inbounds rules to be able to connect to the RDS instance.
- You can find the database info in your AWS Lambda configuration (host, user, password, post)
