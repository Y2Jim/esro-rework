LBPhone version

Resource name:
gum-esro-lbphone

What this bridge now does:
- Registers ESRO as a real LBPhone custom app
- Leaves ESRO downloadable from the LBPhone App Store by default
- Opens the actual gum-esro UI instead of the old ox_lib placeholder menu
- Relies on gum-esro for phone notification routing while this bridge handles LBPhone app registration and launch

Required resource order:
1. lb-phone
2. gum-esro
3. gum-esro-lbphone

Expected behavior:
- ESRO appears in the LBPhone App Store
- Players can download ESRO from the store
- Opening ESRO launches the real gum-esro interface
- Closing ESRO returns the player to LBPhone

Bridge hooks still exposed:
- exports['gum-esro-lbphone']:OpenFromPhone()
- exports['gum-esro-lbphone']:OpenESRO()
- exports['gum-esro-lbphone']:OpenLBPhone()
- TriggerEvent('gum-esro-lbphone:client:OpenFromPhone')
- TriggerEvent('gum-esro-lbphone:client:OpenESRO')