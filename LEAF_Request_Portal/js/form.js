/************************
    Form editor
*/
var form;
var formValidator = {};
var formRequired = {};
var formConditions = {};
var LeafForm = function(containerID) {
	var containerID = containerID;
	var prefixID = 'LeafForm' + Math.floor(Math.random()*1000) + '_';
	var htmlFormID = prefixID + 'record';
	var dialog;
	var recordID = 0;
	var postModifyCallback;

	$('#' + containerID).html('<div id="'+prefixID+'xhrDialog" style="display: none; background-color: white; border-style: none solid solid; border-width: 0 1px 1px; border-color: #e0e0e0; padding: 4px">\
			<form id="'+prefixID+'record" enctype="multipart/form-data" action="javascript:void(0);">\
			    <div>\
			    	<div id="form-xhr-cancel-save-menu" style="border-bottom: 2px solid black; height: 30px">\
			        	<button id="'+prefixID+'button_cancelchange" class="buttonNorm" ><img src="../libs/dynicons/?img=process-stop.svg&amp;w=16" alt="cancel" /> Cancel</button>\
			        	<button id="'+prefixID+'button_save" class="buttonNorm"><img src="../libs/dynicons/?img=media-floppy.svg&amp;w=16" alt="save" /> Save Change</button>\
			        </div>\
			        <div id="'+prefixID+'loadIndicator" style="visibility: hidden; position: absolute; text-align: center; font-size: 24px; font-weight: bold; background: white; padding: 16px; height: 300px; width: 460px">Loading... <img src="images/largespinner.gif" alt="loading..." /></div>\
			        <div id="'+prefixID+'xhr" style="min-width: 540px; min-height: 420px; padding: 8px; overflow: auto"></div>\
			    </div>\
			</form>\
			</div>');
	dialog = new dialogController(prefixID+'xhrDialog', prefixID+'xhr', prefixID+'loadIndicator', prefixID+'button_save', prefixID+'button_cancelchange');

	function setRecordID(id) {
		recordID = id;
	}
	
	function setPostModifyCallback(func) {
		postModifyCallback = func;
	}

	function sanitize(input){
		input = input.replace(/&/g, '&amp;');
        input = input.replace(/</g, '&lt;');
        input = input.replace(/>/g, '&gt;');
        input = input.replace(/"/g, '&quot;');
        input = input.replace(/'/g, '&#039;');
		return input;
	}
	
	function handleConditionalIndicators(formConditions){
		
		const conditions = formConditions.conditions;
		const format = formConditions.format;  //current format set in form editor
		const chosenShouldUpdate = format === 'dropdown';
		const allowedChildFormats = ['dropdown', 'text'];
		console.log('f', format, 'c', conditions);

		for (let i in conditions) {
			const elParentInd = document.getElementById(conditions[i].parentIndID);
			const elChildInd = document.getElementById(conditions[i].childIndID);
			const elJQParentID = $('#' + conditions[i].parentIndID);
			const elJQChildID = $('#' + conditions[i].childIndID);
			const childFormatIsEnabled = allowedChildFormats.some(f => f === format);
			
			let comparison = false;
			//parent questions are still dropdown only
			if (childFormatIsEnabled && elParentInd !== null && elParentInd.nodeName === 'SELECT') {
				//*NOTE: need format for various plugins (icheck, chosen, etc)
				
				let currChildValidator = form.dialog().requirements[conditions[i].childIndID];
				let currChildVal = elChildInd.value;
				
				if (chosenShouldUpdate) {
					elJQChildID.chosen({width: '80%'}).on('change', function () {
						currChildVal = elChildInd.value;
					});
			 	} 
				//NOTE: FIX: needs to run once initially, since initial value can be trigger value
				elJQParentID.chosen({width: '80%'}).on('change', function () {
					const val = elParentInd.value;
					let compVal = conditions.map(c => {
						if (conditions[i].parentIndID === c.parentIndID
							//&& conditions[i].selectedParentValue === c.selectedParentValue
							&& conditions[i].selectedOutcome === c.selectedOutcome)
							return c.selectedParentValue
					});//conditions[i].selectedParentValue;
					compVal = new Set(compVal);
					compVal = Array.from(compVal);
					console.log('CompVal: ', compVal, 'Val: ', val);
					
					//TODO: need format for some comparisons (eg str, num, dates), OR use distinct cases for numbers, dates etc
					switch (conditions[i].selectedOp) {
						case '==':
							comparison = compVal.some(v => v === sanitize(val));
							break;
						case '!=':
							comparison = compVal.every(v => v !== sanitize(val));
							break;
						case '>':
							comparison = sanitize(val) > compVal;
							break;
						case '<':
							comparison = sanitize(val) < compVal;
							break;
						default:
							console.log(conditions[i].selectedOp);
							break;
					}
				});
				
				switch (conditions[i].selectedOutcome) {
					case 'Hide':
						elJQParentID.chosen().on('change', function () {
							if (comparison) {
								if (chosenShouldUpdate) {
									elJQChildID.chosen().val('');
									elJQChildID.trigger('chosen:updated');
								}
								$('.blockIndicator_' + conditions[i].childIndID).hide();

								if (currChildValidator !== undefined){
									form.dialog().requirements[conditions[i].childIndID] = function(){return false};
								}
							} else {
								$('.blockIndicator_' + conditions[i].childIndID).show();

								if (currChildValidator !== undefined){
									form.dialog().requirements[conditions[i].childIndID] = currChildValidator;
								}
								if (currChildVal && chosenShouldUpdate) { //updates with prev dd selection if there had been one
									elJQChildID.chosen().val(currChildVal);
									elJQChildID.trigger('chosen:updated');
								}
							}
						});
						break;
					case 'Show':
						elJQParentID.chosen().on('change', function () {
							if (comparison) {
								$('.blockIndicator_' + conditions[i].childIndID).show();
								if (currChildVal && chosenShouldUpdate) {
									elJQChildID.chosen().val(currChildVal);
									elJQChildID.trigger('chosen:updated');
								}

								if (currChildValidator !== undefined){
									form.dialog().requirements[conditions[i].childIndID] = currChildValidator;
								}
							} else {
								if (chosenShouldUpdate) {
									elJQChildID.chosen().val('');
									elJQChildID.trigger('chosen:updated');
								}
								$('.blockIndicator_' + conditions[i].childIndID).hide();

								if (currChildValidator !== undefined){
									form.dialog().requirements[conditions[i].childIndID] = function(){return false};
								}
							}
						});
						break;
					case 'Pre-fill':
						elJQParentID.chosen().on('change', function () {
							if (comparison) {
								elJQChildID.attr('disabled', 'disabled');
								if (chosenShouldUpdate) {
									elJQChildID.chosen().val(conditions[i].selectedChildValue);
									elJQChildID.trigger('chosen:updated');
								}
							} else {
								elJQChildID.removeAttr('disabled');
								if (chosenShouldUpdate) {
									elJQChildID.chosen().val('');
									elJQChildID.trigger('chosen:updated');
								}
							}
						});
						break; 
					default:
						console.log(conditions[i].selectedOutcome);
						break;
				} 
				elJQParentID.chosen().trigger('change');
			}
		}
	}

	function doModify() {
		if(recordID == 0) {
			console.log('recordID not set');
			return 0;
		}

		var hasTable = $('#' + htmlFormID).find('.tableinput').length !== 0;
		var temp = $('#' + dialog.btnSaveID).html();
		$('#' + dialog.btnSaveID).empty().html('<img src="images/indicator.gif" alt="saving" /> Saving...');

		$('#' + htmlFormID).find(':input:disabled').removeAttr('disabled');

		var data = {recordID: recordID};
		$('#' + htmlFormID).serializeArray().map(function(x){data[x.name] = x.value;});

		if(hasTable){
            var tables = [];

			$('#' + htmlFormID).find('.tableinput > table').each(function(index) {
				var gridObject = {};
                gridObject.cells = [];
                gridObject.names = [];

                // determines the order of the column values
                gridObject.columns = [];

                $('thead', this).find('td').slice(0, -1).each(function() {
                    gridObject.names.push($(this).text());
                    gridObject.columns.push($('div', this).attr('id'));
				});

				$('tbody', this).find('tr').each(function(){
                    var cellArr = [];
					$(this).children('td').each(function() {
                        if($('textarea', this).length) {
                            cellArr.push($(this).find('textarea').val());
                        } else if($('select', this).length){
                            cellArr.push($("option:selected", this).val());
						} else if($('input', this).length) {
                            cellArr.push($("input", this).val());
                        }
                    });
                    gridObject.cells.push(cellArr);
				});
				tables[index] = {
					id: $(this).attr('id').split('_')[1],
					data: gridObject,
				};
            });

            $('#' + htmlFormID).serializeArray().map(function(){
            	for(var i = 0; i < tables.length; i++){
                    data[tables[i].id] = tables[i].data;
                }
            });
		}

	    $.ajax({
	        type: 'POST',
	        url: 'ajaxIndex.php?a=domodify',
	        data: data,
	        dataType: 'text',
	        success: function(res) {
	        	if(postModifyCallback != undefined) {
	        		postModifyCallback();
	        	}
	            $('#' + dialog.btnSaveID).empty().html(temp);
	        },
	        cache: false
	    });
	}

	function getForm(indicatorID, series) {
		if(recordID == 0) {
			console.log('recordID not set');
			return 0;
		}
	    dialog.indicateBusy();

	    dialog.setSaveHandler(function() {
	    	doModify();
	    });

	    formValidator = new Object();
	    formRequired = new Object();
	    formConditions = new Object();
	    $.ajax({
	        type: 'GET',
	        url: "ajaxIndex.php?a=getindicator&recordID=" + recordID + "&indicatorID=" + indicatorID + "&series=" + series,
	        dataType: 'text',
	        success: function(response) {
	        	dialog.setTitle('Editing #' + recordID);
	            dialog.setContent(response);

	            for(let i in formValidator) {
	            	let tID = i.slice(2);
	            	dialog.setValidator(tID, formValidator[i].setValidator);
	            	dialog.setSubmitValid(tID, formValidator[i].setSubmitValid);
	                dialog.setValidatorError(tID, formValidator[i].setValidatorError);
	                dialog.setValidatorOk(tID, formValidator[i].setValidatorOk);
	            }

	            for(let i in formRequired) {
	            	let tID = i.slice(2);
	            	dialog.setRequired(tID, formRequired[i].setRequired);
					dialog.setSubmitError(tID, formRequired[i].setSubmitError);
	            	dialog.setRequiredError(tID, formRequired[i].setRequiredError);
	            	dialog.setRequiredOk(tID, formRequired[i].setRequiredOk);
	            }

	            dialog.enableLiveValidation();

				for (let c in formConditions) {
					handleConditionalIndicators(formConditions[c]);
				}
				
	        },
	        error: function(response) {
	        	dialog.setContent("Error: " + response);
	        },
	        cache: false
	    });
	}

	function initCustom(containerID, contentID, indicatorID, btnSaveID, btnCancelID) {
		dialog = new dialogController(containerID, contentID, indicatorID, btnSaveID, btnCancelID);
		prefixID = '';
		htmlFormID = 'record';
	}

	function setHtmlFormID(id) {
		htmlFormID = id;
	}

	return {
		dialog: function() { return dialog; },
		getHtmlFormID: function() { return htmlFormID; },
		serializeData: function() { return $('#' + htmlFormID).serialize(); },

		setRecordID: setRecordID,
		setPostModifyCallback: setPostModifyCallback,
		doModify: doModify,
		getForm: getForm,
		initCustom: initCustom,
		setHtmlFormID: setHtmlFormID
	}
};