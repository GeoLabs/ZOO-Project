1. Create a virtual environemnt "python -m venv zoo-eoapi-venv"
2. Install these pacakges:
python -m pip install pip -U
python -m pip install pystac
python -m pip install pypgstac==0.7.9 psycopg[binary,pool]
python -m pip install folium #you need it later in the demos
3. Run a Jupyter Notebook in your Venv: https://stackoverflow.com/questions/33496350/execute-python-script-within-jupyter-notebook-using-a-specific-virtualenv?rq=3
    * Start the notebook in a dedicated bash/cmd

4. Create list of items (using rio-stac)

```bash
$ aws s3 ls noaa-eri-pds/2020_Nashville_Tornado/20200307a_RGB/ \
    | awk '{print "s3://noaa-eri-pds/2020_Nashville_Tornado/20200307a_RGB/"$NF}' \
    | grep ".tif" | head -n 3 \
    | while read line; do rio stac $line -c "noaa-emergency-response" -p "event"="Nashville Tornado"  -d "2020-03-07" --without-raster --without-proj --asset-mediatype COG -n cog; done \
    > noaa-eri-nashville2020_2.json
```

2. Create collection.json
```json
{
    "id": "noaa-emergency-response",
    "title": "NOAA Emergency Response Imagery",
    "description": "NOAA Emergency Response Imagery hosted on AWS Public Dataset.",
    "stac_version": "1.0.0",
    "license": "public-domain",
    "links": [],
    "extent": {
        "spatial": {
            "bbox": [
                [
                    -180,
                    -90,
                    180,
                    90
                ]
            ]
        },
        "temporal": {
            "interval": [
                [
                    "2005-01-01T00:00:00Z",
                    "null"
                ]
            ]
        }
    }
}
```

5. upload collection and items to the RDS postgres instance (using pypgstac)

```bash
# Check the database connection
$ pypgstac pgready --dsn postgresql://username:password@127.0.0.1:5439/postgis #og was 0.0.0.0

# $ pypgstac load collections noaa-emergency-response.json --dsn postgresql://{db-user}:{db-password}@{db-host}:{db-port}/{db-name}
$ pypgstac load collections noaa-emergency-response.json --dsn postgresql://username:password@127.0.0.1:5439/postgis

# $ pypgstac load items noaa-eri-nashville2020.json --dsn postgresql://{db-user}:{db-password}@{db-host}:{db-port}/{db-name}
pypgstac load items noaa-eri-nashville2020.json --dsn postgresql://username:password@127.0.0.1:5439/postgis
```

Note:

- You may have to add you address IP to the VPC inbounds rules to be able to connect to the RDS instance.
- You can find the database info in your AWS Lambda configuration (host, user, password, post)
