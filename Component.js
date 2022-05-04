sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/fsBioenergiaZLAN_PROG_ENTREGA/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.fsBioenergiaZLAN_PROG_ENTREGA.Component", {

		metadata: {
			manifest: "json",
			config: {
				fullWidth: true
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});