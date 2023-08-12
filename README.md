# Irregular Verbs (CF Application)

## Deploy to Cloud Foundry
```powershell
# build mta
mbt build -t gen --mtar mta.tar

# login CF
cf api <cf_url>
cf login

# deploy to CF
cf deploy gen/mta.tar
```

## Application Router

[Irregular Verbs Application](https://f6189f41trial-dev-irregular-verbs-app.cfapps.us10-001.hana.ondemand.com/index.html)
