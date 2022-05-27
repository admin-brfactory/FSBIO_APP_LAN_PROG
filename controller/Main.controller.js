sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"com/fsBioenergiaZLAN_PROG_ENTREGA/model/formatter",
	'sap/ui/core/Fragment',
	'sap/m/MessageToast',
	"sap/m/MessageBox"
], function(Controller, JSONModel, formatter, Fragment, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("com.fsBioenergiaZLAN_PROG_ENTREGA.controller.Main", {

		formatter: formatter,

		onInit: function() {
			var oViewModel = new JSONModel({

				listaSemanas: [],
				produtoSelecionado: "",
				vendedor: "",
				listaProdutos: [],
				listaCaminhoes: [],
				listaJustif: [],
				listIncoterm: [],
				justifSelecionado: "",
				listaPagamentos: [],
				tblCargas: [],
				numSemanaAtual: "",
				btnVisibility: false,
				btnAntEnabled: true,
				btnProxEnabled: true,
				inpEnabled: true,
				SelCaminhaoEnabled: true,
				SelPagEnabled: true,
				msgSuccess: "",
				cotasDiarias: [],
				tabProgGeral: [],
				tabProg: [],
				tabProgCompara: [],
				repetirSemanas: [],
				produtosEncaixe: [],
				caminhoesEncaixe: [],
				tabelaProg: [],
				numSemana: 0,
				diaMes: [],
				diaMesSom: 0,
				tabCompara: "",
				numSemanaBind: "",
				indiceSemana: 3

			});
			var data = new Date();

			this.getView().setModel(oViewModel, "progView");
			this.getWeekNumber(data);
			this.getProgramacao();

		},
		
		// Função usada para repetir programação
		onRepetirProg: function(oEvent) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var semanaSelec = oEvent.getSource().getSelectedKeys();

			if (semanaSelec == "" || semanaSelec == null) {
				return;
			}

			var cliente = oEvent.getSource().getParent().getCells()[0].getText();
			var linhaRepet = oEvent.getSource().getParent().getBindingContext('progView').getPath();
			var tabProgGeral = oViewModel.getProperty("/tabProgGeral");
			var tabBind = oViewModel.getProperty(linhaRepet);

			for (var i = 0; i < semanaSelec.length; i++) {

				var tabGeralAux = tabProgGeral.filter(indice => indice.SEMANA == semanaSelec[i]);

				if (tabGeralAux == "[]" || tabGeralAux == null) {
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgErrorInesperado"));
					return;
				}

				var tabAux2 = tabGeralAux[0].DADOS_SEMANA.filter(indice => indice.DEN_CLIENTE == cliente);
				tabAux2[0].SEG = tabBind.SEG;
				tabAux2[0].TER = tabBind.TER;
				tabAux2[0].QUA = tabBind.QUA;
				tabAux2[0].QUI = tabBind.QUI;
				tabAux2[0].SEX = tabBind.SEX;
				tabAux2[0].SAB = tabBind.SAB;
				tabAux2[0].DOM = tabBind.DOM;

				var tabAux3 = tabGeralAux[0].DADOS_SEMANA.filter(indice => indice.CLIENTE != cliente);

				tabAux3.push(tabAux2[0]);

				tabProgGeral = tabProgGeral.filter(indice => indice.SEMANA != semanaSelec);

				tabProgGeral.push(tabGeralAux[0]);

				oViewModel.setProperty("/tabProgGeral", tabProgGeral);
			}
		},

		cancelarProg: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var getLinha = this.getView().byId("table3").getSelectedIndices();
			var dadosCancelar = [];
			
			if (getLinha.length == 0) {
				MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgLinhaNaoSelec"));
				return;
			}
			
			for ( var i = 0; i < getLinha.length; i++){
				var linhaSelecionadaBindCan = this.getView().byId("table3").getBindingInfo("rows").binding.getPath() + "/" + getLinha[i];
				var oDadosSelec = oViewModel.getProperty(linhaSelecionadaBindCan);
				dadosCancelar.push(oDadosSelec)
				
				var justificativa = oDadosSelec.ID_JUSTIFICATIVA;
				if (!justificativa) {
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgSelecJustif"));
					return;
				}
			}

			 dadosCancelar = JSON.stringify(dadosCancelar);

			var oEntry = {
				
				DADOS_CANCELAR: dadosCancelar,

			};

			sap.ui.core.BusyIndicator.show();
			oModel.create("/CANCELAR_PROGRAMACAOSet", oEntry, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();
					
					if (oData.MSG_RETORNO) {
						var msg = JSON.parse(oData.MSG_RETORNO)

						if (msg.length > 0) {
							if (msg[0].TYPE === "E") {
								MessageBox.error(msg[0].MESSAGE);
							} else if (msg[0].TYPE === "S") {
								MessageBox.success(msg[0].MESSAGE);
							}
						}
					}

					this.closeCancelar();

				}.bind(this),

				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgErroInesperadoTN"));
				}.bind(this)
			});

		},

		salvarProg: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var numSemana = oViewModel.getProperty("/numSemanaBind");
			this.guardaDadosTela(numSemana);
			var tabela = this.getView().getModel("progView").getProperty("/tabProgGeral");
			var tabProg = oViewModel.getProperty("/tabProg");
			var codMaterial = oViewModel.getProperty("/produtoSelecionado");
			var codVendedor = oViewModel.getProperty("/vendedor/COD_VENDEDOR");

			if (tabProg == "") {
				MessageBox.warning(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgTblSemDados"));
				return;
			}

			var dadosSalvosString = JSON.stringify(tabela);
			var oEntry = {

				COD_MATERIAL: codMaterial,
				COD_VENDEDOR: codVendedor,
				DADOS_PROG: dadosSalvosString

			};

			sap.ui.core.BusyIndicator.show();
			oModel.create("/SALVAR_PROGRAMACAOSet", oEntry, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.MSG_RETORNO) {
						var msg = JSON.parse(oData.MSG_RETORNO)

						if (msg.length > 0) {
							if (msg[0].TYPE === "E") {
								MessageBox.error(msg[0].MESSAGE);
							} else if (msg[0].TYPE === "S") {
								MessageBox.success(msg[0].MESSAGE);
							}
						}
					}

				}.bind(this),

				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgErroInesperadoTN"));
				}.bind(this)
			});
		},

		salvarEncaixe: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var vendedor = oViewModel.getProperty("/vendedor").COD_VENDEDOR;
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var produto = this.getView().byId("listProdutoEncaixe").getSelectedKey();
			var caminhao = this.getView().byId("listiCaminhaoEncaixe").getSelectedKey();
			var cliente = this.getView().byId("enCliente").getValue();
			var frete = this.getView().byId("enFrete").getSelectedKey();
			var qtdCarregamento = this.getView().byId("enQtdCarregamento").getValue();
			var dtCarregamento = this.convertDate(this.getView().byId("enDtCarregamento").getValue());

			if (!vendedor || !produto || !caminhao || !cliente || !frete || !qtdCarregamento || !dtCarregamento) {
				MessageBox.error("Preencher campos obrigatorios");
				return;
			}

			var oEntry = {
				VENDEDOR: vendedor,
				USUARIO: usuario,
				PRODUTO: produto,
				CAMINHAO: caminhao,
				CLIENTE: cliente,
				FRETE: frete,
				QTD_CARREGAMENTO: qtdCarregamento,
				DT_CARREGAMENTO: dtCarregamento
			};

			sap.ui.core.BusyIndicator.show();
			oModel.create("/ENCAIXARSet", oEntry, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					var msg = JSON.parse(oData.MSG_RETORNO)
					MessageBox.success(msg[0].MESSAGE);

					this.closeEncaixe();

				}.bind(this),

				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgErroInesperadoTN"));
				}.bind(this)
			});

		},

		limparCampos: function() {
			this.getView().byId("listProdutoEncaixe").setSelectedKey();
			this.getView().byId("listiCaminhaoEncaixe").setSelectedKey();
			this.getView().byId("enCliente").setValue("");
			this.getView().byId("enFrete").setValue("");
			this.getView().byId("enQtdCarregamento").setValue("");
			this.getView().byId("enDtCarregamento").setValue("");
		},

		convertDate: function(date) {
			var dateString = date.replace(".", "");
			var dateString2 = dateString.replace(".", "");
			var ano = dateString2.substr(4, 4);
			var mes = dateString2.substr(2, 2);
			var dia = dateString2.substr(0, 2);

			return ano + mes + dia;
		},

		getCargas: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var data = new Date();
			var semana = oViewModel.getProperty("/numSemana");
			var getLinha = this.getView().byId("table1").getSelectedIndices();
			var linhaSelecionadaBind = this.getView().byId("table1").getBindingInfo("rows").binding.getPath() + "/" + getLinha[0];
			var oDadosSelec = oViewModel.getProperty(linhaSelecionadaBind);
			var vendedor = oViewModel.getProperty("/vendedor/COD_VENDEDOR");
			var centro = oDadosSelec.WERKS;
			var incoterm = oDadosSelec.INCOTERMS;
			var cliente = oDadosSelec.CLIENTE; 
			var material = oViewModel.getProperty("/produtoSelecionado");
			var sURL = "/GET_CARGASet(SEMANA='" + semana + "',VENDEDOR='" + vendedor + "',MATERIAL='" + material + "',CENTRO='" + centro +
				"',INCOTERM='" + incoterm + "',CLIENTE='" + cliente + "')";

			sap.ui.core.BusyIndicator.show();
			oModel.read(sURL, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.CARGAS) {
						var cargas = JSON.parse(oData.CARGAS)
						oViewModel.setProperty("/tblCargas", cargas);
					}
					if (oData.LISTA_INCOTERMS) {
						var listIncoterm = JSON.parse(oData.LISTA_INCOTERMS)
						oViewModel.setProperty("/listIncoterm", listIncoterm)
					}
					
					
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		guardaDadosTela: function(sSemana) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var tabProgGeral = oViewModel.getProperty("/tabProgGeral");
			var tabProg = oViewModel.getProperty("/tabProg")
			var tabCotasDiarias = oViewModel.getProperty("/cotasDiarias");
			var ano = new Date().getFullYear();
			var tabBind;

			var tabGeralAux = tabProgGeral.filter(indice => indice.SEMANA == sSemana);

			tabGeralAux[0].DADOS_SEMANA = tabProg;
			tabGeralAux[0].COTAS_DIARIAS_SEM = tabCotasDiarias;

			tabProgGeral = tabProgGeral.filter(indice => indice.SEMANA != sSemana);

			tabProgGeral.push(tabGeralAux[0]);
			tabProgGeral.sort((a, b) => {
				return a.SEMANA - b.SEMANA;
			})
			oViewModel.setProperty("/tabProgGeral", tabProgGeral);

		},

		setTableBind: function(NextPrev) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var indiceSemana = oViewModel.getProperty("/indiceSemana");
			var tabProgGeral = oViewModel.getProperty("/tabProgGeral");
			var semana;

			try {
				semana = tabProgGeral[indiceSemana].SEMANA;
			} catch (e) {
				indiceSemana = 0
				semana = tabProgGeral[indiceSemana].SEMANA;
			}

			var tabBind;
			var tabCheckProxAntSemana = true;
			var produto = this.getView().byId('produto').getSelectedKey();
			var ano = new Date().getFullYear();
			var proxSemana = semana + 1;

			if (NextPrev == "proximo") {
				if (typeof(tabProgGeral[indiceSemana + 1]) == "undefined") {
					tabCheckProxAntSemana = false;
				}

				if (tabCheckProxAntSemana == false) {
					oViewModel.setProperty("/btnProxEnabled", false);
				}

				if (oViewModel.getProperty("/btnAntEnabled") === false) {
					oViewModel.setProperty("/btnAntEnabled", true);
				}

				tabBind = tabProgGeral.filter(indice => indice.SEMANA == semana);

				oViewModel.setProperty("/tabProg", tabBind[0].DADOS_SEMANA);
				oViewModel.setProperty("/cotasDiarias", tabBind[0].COTAS_DIARIAS_SEM);
				oViewModel.setProperty("/diaMes", tabBind[0].DIA_SEMANA[0]);
				oViewModel.setProperty("/numSemanaBind", tabBind[0].SEMANA);

			} else if (NextPrev == "anterior") {
				if (typeof(tabProgGeral[indiceSemana - 1]) == "undefined") {
					tabCheckProxAntSemana = false;
				}

				if (tabCheckProxAntSemana == false) {
					oViewModel.setProperty("/btnAntEnabled", false);
				}

				if (oViewModel.getProperty("/btnProxEnabled") === false) {
					oViewModel.setProperty("/btnProxEnabled", true);
				}

				tabBind = tabProgGeral.filter(indice => indice.SEMANA == semana);

				oViewModel.setProperty("/tabProg", tabBind[0].DADOS_SEMANA);
				oViewModel.setProperty("/cotasDiarias", tabBind[0].COTAS_DIARIAS_SEM);
				oViewModel.setProperty("/diaMes", tabBind[0].DIA_SEMANA[0]);
				oViewModel.setProperty("/numSemanaBind", tabBind[0].SEMANA);

			} else {
				if (typeof(tabProgGeral[indiceSemana - 1]) == "undefined") {
					tabCheckProxAntSemana = false;
				}

				if (tabCheckProxAntSemana == false) {
					oViewModel.setProperty("/btnAntEnabled", false);
				} else {
					oViewModel.setProperty("/btnAntEnabled", true);
				}

				tabCheckProxAntSemana = true

				if (typeof(tabProgGeral[indiceSemana + 1]) == "undefined") {
					tabCheckProxAntSemana = false;
				}

				if (tabCheckProxAntSemana == false) {
					oViewModel.setProperty("/btnProxEnabled", false);
				} else {
					oViewModel.setProperty("/btnProxEnabled", true);
				}

				indiceSemana = tabProgGeral.findIndex(indice => indice.SEMANA == semana)

				tabBind = tabProgGeral.filter(indice => indice.SEMANA == semana);

				if (tabBind.length == 0) {
					MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgErroInesperadoTN"));
					return;
				}

				oViewModel.setProperty("/tabProg", tabBind[0].DADOS_SEMANA);
				oViewModel.setProperty("/cotasDiarias", tabBind[0].COTAS_DIARIAS_SEM);
				oViewModel.setProperty("/diaMes", tabBind[0].DIA_SEMANA[0]);
				oViewModel.setProperty("/numSemanaBind", tabBind[0].SEMANA);

				this.btnVisible();
				this.inpEnabled();
				this.SelectEnabled();
				this.setSemanasRep();
			}

		},

		setSemanasRep: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var semana = oViewModel.getProperty("/numSemanaBind");
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");
			var semanas = oViewModel.getProperty("/listaSemanas");
			var semanaBind;

			semanaBind = semanas.filter(indice => indice.ID_SEMANA != semana);
			semanaBind = semanaBind.filter(indice => indice.ID_SEMANA != semanaAtual);
			oViewModel.setProperty("/repetirSemanas", semanaBind);

		},

		pesquisar: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var tabCompara = oViewModel.getProperty("/tabCompara");
			var tabProgGeral = oViewModel.getProperty("/tabProgGeral");
			tabProgGeral = JSON.stringify(tabProgGeral);

			if (tabProgGeral !== tabCompara) {
				MessageBox.warning(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgProgNaoGravada"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
					onClose: function(sAction) {
						if (sAction == MessageBox.Action.OK) {
							this.getProgramacao();
						}
					}.bind(this),
				});
			} else {
				this.getProgramacao();
			};

		},

		getProgramacao: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			oViewModel.setProperty("/produtoSelecionado", this.getView().byId("produto").getSelectedKey());
			var cod_vendedor = oViewModel.getProperty("/vendedor/COD_VENDEDOR");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var semana = oViewModel.getProperty("/numSemanaAtual");
			var produto = this.getView().byId('produto').getSelectedKey();
			var sUrl = "/GET_PROGRAMACAOSet(USUARIO='" + usuario + "',SEMANA='" + semana + "',PRODUTO='" + produto + "',COD_VENDEDOR='" + cod_vendedor + "')";

			sap.ui.core.BusyIndicator.show();

			oModel.read(sUrl, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.TABELA_PROGRAMACAO) {
						var tabelaProgramacao = JSON.parse(oData.TABELA_PROGRAMACAO);
					}

					oViewModel.setProperty("/tabProgGeral", tabelaProgramacao);
					oViewModel.setProperty("/tabCompara", JSON.stringify(tabelaProgramacao));

					if (oData.LISTA_SEMANAS) {
						var listaSemanas = JSON.parse(oData.LISTA_SEMANAS);
						oViewModel.setProperty("/listaSemanas", listaSemanas);
					}

					if (oData.DADOS_VENDEDOR) {
						var vendedor = JSON.parse(oData.DADOS_VENDEDOR);
						oViewModel.setProperty("/vendedor", vendedor);
					}

					if (oData.LISTA_PRODUTOS) {
						var listaProdutos = JSON.parse(oData.LISTA_PRODUTOS)
						var vazio = {
							COD_PRODUTO: "",
							PRODUTO: ""
						};

						listaProdutos.unshift(vazio);

						oViewModel.setProperty("/listaProdutos", listaProdutos);
					}

					if (oData.TABELA_PROGRAMACAO) {
						var tabProg = JSON.parse(oData.TABELA_PROGRAMACAO);
						var tabProgCompara = JSON.parse(oData.TABELA_PROGRAMACAO);

						oViewModel.setProperty("/tabProg", tabProg);
						oViewModel.setProperty("/tabProgCompara", tabProgCompara);
					}

					if (oData.LISTA_CAMINHOES) {
						var listaCaminhoes = JSON.parse(oData.LISTA_CAMINHOES);
						oViewModel.setProperty("/listaCaminhoes", listaCaminhoes);
					}

					if (oData.LISTA_JUSTIFICATIVAS) {
						var listaJustif = JSON.parse(oData.LISTA_JUSTIFICATIVAS);
						var vazio = {
							ID_JUSTIFICATIVA: "",
							JUSTIFICATIVA: ""
						};

						listaJustif.unshift(vazio);

						oViewModel.setProperty("/listaJustif", listaJustif);
					}

					if (oData.LISTA_PAGAMENTOS) {
						var listaPagamentos = JSON.parse(oData.LISTA_PAGAMENTOS);
						oViewModel.setProperty("/listaPagamentos", listaPagamentos);
					}

					this.setTableBind();
					this.setSemanasRep();

				}.bind(this),

				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();

				}
			});
		},

		calculoCota: function(oEvent) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("progView");
			var oTable = this.getView().byId("table1").getRows();
			var diaSemana = oEvent.getSource().getBindingInfo('value').binding.getPath();
			var cotaDigitada = oEvent.getParameter('value');
			var linhaTab = oEvent.getSource().getParent().getBindingContext('progView').getPath().substr(9);

			var sCell = 0;
			switch (diaSemana) {
				case "SEG":
					sCell = 6;
					break;
				case "TER":
					sCell = 7;
					break;
				case "QUA":
					sCell = 8;
					break;
				case "QUI":
					sCell = 9;
					break;
				case "SEX":
					sCell = 10;
					break;
				case "SAB":
					sCell = 11;
					break;
				case "DOM":
					sCell = 12;
					break;
			}

			this.valorProg(sCell, diaSemana, linhaTab);

		},

		valorProg: function(sCell, sDia, sLinha) {
			var iTab2 = '';
			switch (sCell) {
				case 6:
					iTab2 = 1;
					break;
				case 7:
					iTab2 = 2;
					break;
				case 8:
					iTab2 = 3;
					break;
				case 9:
					iTab2 = 4;
					break;
				case 10:
					iTab2 = 5;
					break;
				case 11:
					iTab2 = 6;
					break;
				case 12:
					iTab2 = 7;
					break;
				default:
					iTab2 = 1;
					break;

			}

			var oTable = this.getView().byId("table1").getRows();
			var oTable2 = this.getView().byId("table2").getRows();
			var progDiaria = oTable2[0].getCells()[iTab2].getText();
			var value = 0;
			var LinhaValue = oTable[sLinha].getCells()[sCell].getValue();

			if (LinhaValue == "") {
				LinhaValue = 0
			}

			for (let index in oTable) {

				var actualRow = oTable[index].getCells()[sCell].getValue();

				if (oTable[index].getCells()[sCell].getValue() == "") {
					actualRow = 0;
				}

				value = value + parseInt(actualRow);
			}

			if (value > progDiaria) {

				value = value - parseInt(LinhaValue);

				oTable[sLinha].getCells()[sCell].setValue(0);

				MessageToast.show("Saldo diario excedido");
			}

			this.getView().getModel("progView").setProperty("/cotasDiarias/1/" + sDia, value);

			value = oTable2[1].getCells()[iTab2].getText();

			var saldoProg = progDiaria - value;

			this.getView().getModel("progView").setProperty("/cotasDiarias/2/" + sDia, saldoProg);

			this.checaNumerico(sCell);

		},

		getWeekNumber: function(d) {
			var oViewModel = this.getView().getModel("progView");
			// Copy date so don't modify original
			d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
			// Set to nearest Thursday: current date + 4 - current day number
			// Make Sunday's day number 7
			d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
			// Get first day of year
			var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
			// Calculate full weeks to nearest Thursday
			var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
			// Return array of year and week number
			var proxSem = weekNo + 1;
			var ano = new Date().getFullYear();
			weekNo = weekNo.toString();

			if (weekNo.length == 1) {
				weekNo = "0" + weekNo;
			}
			weekNo = ano + weekNo;
			oViewModel.setProperty("/numSemanaAtual", weekNo);
			oViewModel.setProperty("/numSemana", proxSem);

			return proxSem;
		},

		dates: function(current) {
			var week = new Array();
			// Starting Monday not Sunday
			current.setDate((current.getDate() - current.getDay() + 7));
			for (var i = 0; i < 7; i++) {
				week.push(
					new Date(current)
				);
				current.setDate(current.getDate() + 1);
			}
			return week;
		},

		getMes: function() {
			var oViewModel = this.getView().getModel("progView");
			var data = new Date();
			var diasSemana = this.dates(data);
			var mes = "";
			var dia = "";
			var diaMes = "";
			var diaMesArray = [];

			for (var i = 0; i < diasSemana.length; i++) {
				var data = new Date(diasSemana[i]);

				mes = data.getMonth() + 1;
				dia = data.getDate();
				diaMes = dia + "/" + mes;
				diaMesArray.push(diaMes);
				mes = "";
				dia = "";
				diaMes = "";
			}
			oViewModel.setProperty("/diaMes", diaMesArray);
		},

		getProximoMes: function() {
			var oViewModel = this.getView().getModel("progView");
			var diaMesSom = oViewModel.getProperty("/diaMesSom");
			var data = new Date();
			var x = new Date(data.setDate(data.getDate() + diaMesSom));
			var diasSemana = this.dates(x);
			var mes = "";
			var dia = "";
			var diaMes = "";
			var diaMesArray = [];

			for (var i = 0; i < diasSemana.length; i++) {
				var data = new Date(diasSemana[i]);

				mes = data.getMonth() + 1;
				dia = data.getDate();
				diaMes = dia + "/" + mes;
				diaMesArray.push(diaMes);
				mes = "";
				dia = "";
				diaMes = "";
			}
			oViewModel.setProperty("/diaMes", diaMesArray);
		},
		
		// Evento disparado ao mudar a semana em tela 
		moveSemana: function(NextPrev) {
			var oViewModel = this.getView().getModel("progView");
			var numSemana = oViewModel.getProperty("/numSemanaBind");
			var indiceSemana = oViewModel.getProperty("/indiceSemana");
			var diaMes = oViewModel.getProperty("/diaMes");
			var diaMesSom = oViewModel.getProperty("/diaMesSom");
			var data = new Date();
			var mes = data.getMonth();
			var dia = data.getDay();
			var oViewModel = this.getView().getModel("progView");
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");

			var tabProgGeral = oViewModel.getProperty("/tabProgGeral");
			var ano = data.getFullYear();
			var tabBind, semana_aux;
			semana_aux = numSemana;

			tabBind = tabProgGeral.filter(indice => indice.SEMANA == semana_aux);

			if (NextPrev == 'proximo') {

				indiceSemana = indiceSemana + 1;
				oViewModel.setProperty("/indiceSemana", indiceSemana);

				if (tabBind.length != 0) {
					this.guardaDadosTela(numSemana);
				}

				diaMesSom = diaMesSom + 7;
				oViewModel.setProperty("/diaMesSom", diaMesSom);

				numSemana = parseInt(numSemana) + 1;

				oViewModel.setProperty("/numSemana", numSemana);
				this.setTableBind(NextPrev);
				this.diaSemanaMais();
				this.btnVisible();
				this.inpEnabled();
				this.SelectEnabled();
				this.setSemanasRep();
				this.limpaTabSelections('table1');
			} else {

				indiceSemana = indiceSemana - 1;
				oViewModel.setProperty("/indiceSemana", indiceSemana)

				if (tabBind.length != 0) {
					this.guardaDadosTela(numSemana);
				}

				diaMesSom = diaMesSom - 7;
				oViewModel.setProperty("/diaMesSom", diaMesSom);

				numSemana = parseInt(numSemana) - 1;

				oViewModel.setProperty("/numSemana", numSemana);
				this.setTableBind(NextPrev);
				this.diaSemanaMenos();
				this.btnVisible();
				this.inpEnabled();
				this.SelectEnabled();
				this.setSemanasRep();
				this.limpaTabSelections('table1');
			}
		},

		inpEnabled: function() {
			var oViewModel = this.getView().getModel("progView");
			var data = new Date();
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");
			var numSemana = oViewModel.getProperty("/numSemanaBind");

			if (semanaAtual == numSemana) {
				oViewModel.setProperty("/inpEnabled", false);
			} else {
				oViewModel.setProperty("/inpEnabled", true);
			}
		},

		SelectEnabled: function() {
			var oViewModel = this.getView().getModel("progView");
			var data = new Date();
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");
			var numSemana = oViewModel.getProperty("/numSemanaBind");

			if (semanaAtual == numSemana) {
				oViewModel.setProperty("/SelCaminhaoEnabled", false);
			} else {
				oViewModel.setProperty("/SelCaminhaoEnabled", true);
			}

			if (semanaAtual == numSemana) {
				oViewModel.setProperty("/SelPagEnabled", false);
			} else {
				oViewModel.setProperty("/SelPagEnabled", true);
			}
		},

		btnVisible: function() {
			var oViewModel = this.getView().getModel("progView");
			var data = new Date();
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");
			var numSemana = oViewModel.getProperty("/numSemanaBind");

			if (semanaAtual == numSemana) {
				oViewModel.setProperty("/btnVisibility", true);
			} else {
				oViewModel.setProperty("/btnVisibility", false);
			}
		},

		ateSemanaAtual: function() {
			var oViewModel = this.getView().getModel("progView");
			var data = new Date();
			var semanaAtual = oViewModel.getProperty("/numSemanaAtual");
			var numSemana = oViewModel.getProperty("/numSemanaBind");

			if (numSemana == semanaAtual) {
				oViewModel.setProperty("/btnAntEnabled", false);
			} else {
				oViewModel.setProperty("/btnAntEnabled", true);
			}
		},

		diaSemanaMais: function() {
			var oViewModel = this.getView().getModel("progView");
			var DOM = oViewModel.getProperty("/DOM");
			var SEG = oViewModel.getProperty("/SEG");
			var TER = oViewModel.getProperty("/TER");
			var QUA = oViewModel.getProperty("/QUA");
			var QUI = oViewModel.getProperty("/QUI");
			var SEX = oViewModel.getProperty("/SEX");
			var SAB = oViewModel.getProperty("/SAB");

			DOM = parseInt(DOM) + 7;
			SEG = parseInt(SEG) + 7;
			TER = parseInt(TER) + 7;
			QUA = parseInt(QUA) + 7;
			QUI = parseInt(QUI) + 7;
			SEX = parseInt(SEX) + 7;
			SAB = parseInt(SAB) + 7;

			oViewModel.setProperty("/DOM", DOM);
			oViewModel.setProperty("/SEG", SEG);
			oViewModel.setProperty("/TER", TER);
			oViewModel.setProperty("/QUA", QUA);
			oViewModel.setProperty("/QUI", QUI);
			oViewModel.setProperty("/SEX", SEX);
			oViewModel.setProperty("/SAB", SAB);
		},

		diaSemanaMenos: function() {
			var oViewModel = this.getView().getModel("progView");
			var DOM = oViewModel.getProperty("/DOM");
			var SEG = oViewModel.getProperty("/SEG");
			var TER = oViewModel.getProperty("/TER");
			var QUA = oViewModel.getProperty("/QUA");
			var QUI = oViewModel.getProperty("/QUI");
			var SEX = oViewModel.getProperty("/SEX");
			var SAB = oViewModel.getProperty("/SAB");

			DOM = parseInt(DOM) - 7;
			SEG = parseInt(SEG) - 7;
			TER = parseInt(TER) - 7;
			QUA = parseInt(QUA) - 7;
			QUI = parseInt(QUI) - 7;
			SEX = parseInt(SEX) - 7;
			SAB = parseInt(SAB) - 7;

			oViewModel.setProperty("/DOM", DOM);
			oViewModel.setProperty("/SEG", SEG);
			oViewModel.setProperty("/TER", TER);
			oViewModel.setProperty("/QUA", QUA);
			oViewModel.setProperty("/QUI", QUI);
			oViewModel.setProperty("/SEX", SEX);
			oViewModel.setProperty("/SAB", SAB);
		},

		openDetalhe: function() {
			if (!this.pDialogDetalhe) {
				this.pDialogDetalhe = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZLAN_PROG_ENTREGA.view.fragments.detalhe", this);
				this.getView().addDependent(this.pDialogDetalhe);
			}
			return this.pDialogDetalhe;
		},

		btnOpenDetalhe: function() {
			var linhaSelec = this.getView().byId("table1").getSelectedIndices();

			if (linhaSelec.length == 0) {
				MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgLinhaNaoSelec"));
			} else {
				this.openDetalhe().open();
				this.getCargas();
			}
		},

		cancDetal: function(oEvent) {
			this.openDetalhe().close();
		},

		openEncaixe: function() {
			if (!this.pDialogEncaixe) {
				this.pDialogEncaixe = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZLAN_PROG_ENTREGA.view.fragments.encaixe", this);
				this.getView().addDependent(this.pDialogEncaixe);
			}
			return this.pDialogEncaixe;
		},

		btnOpenEncaixe: function() {
			this.openEncaixe().open();
			this.getCargas();
		},

		closeEncaixe: function(oEvent) {
			this.openEncaixe().close();
			this.openDetalhe().close();
			this.limparCampos();
			this.limpaTabSelections('table1');
		},

		openCancelar: function() {
			if (!this.pDialogCancelar) {
				this.pDialogCancelar = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZLAN_PROG_ENTREGA.view.fragments.cancelar",
					this);
				this.getView().addDependent(this.pDialogCancelar);
			}
			return this.pDialogCancelar;
		},

		btnOpenCancelar: function() {
			this.openCancelar().open();
			this.getCargas();
		},

		closeCancelar: function(oEvent) {

			var linhaSelec = this.getView().byId("table3").getSelectedIndices();

			if (linhaSelec.length == 0) {
				MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgLinhaNaoSelec"));
			} else {
				this.openCancelar().close();
				this.openDetalhe().close();
				this.limpaTabSelections('table1');
				this.limpaTabSelections('table3');
			}
		},

		onCloseDialog: function(sID) {
			this.byId(sID).close();
			this.limpaTabSelections('table3');
			this.limparCampos();
			
		},

		limpaTabSelections: function(sID) {
			var oTable = this.getView().byId(sID);
			oTable.clearSelection();
		},

		onBtnSalvarProg: function(oEvent) {
			this.salvarProg();
			this.limpaTabSelections('table1');
			this.getProgramacao();
		},

		//Verifica se o valor do campo é númerico
		checaNumerico: function(sCell) {
			var regExp = /[a-zA-Z]/g;
			var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?°¨¨ºª₢£¢¬§`~´çÇ]+/;
			var oTableRows = this.getView().byId("table1").getRows()

			for (let index in oTableRows) {
				var sValue = oTableRows[index].getCells()[sCell].getValue();

				if (sValue == "") {
					oTableRows[index].getCells()[sCell].setValue(0)
				} else if (sValue !== "" && sValue.length > 1 && sValue.substr(0, 1) == "0") {
					sValue = sValue.substr(1);
					oTableRows[index].getCells()[sCell].setValue(sValue);
				}

				if (regExp.test(sValue) || format.test(sValue)) {
					oTableRows[index].getCells()[sCell].setValue(sValue.substring(0, sValue.length - 1));
				}
			}

		},
	});
});