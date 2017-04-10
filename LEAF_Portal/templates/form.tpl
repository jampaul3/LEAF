<div class="section group">
    <div class="col span_1_of_5" id="container_left">
        <div id="navtree" style="border: 1px solid black"></div>
    </div>
    <div class="col span_3_of_5">
        <div style="background-color: white; border: 1px solid black; box-shadow: 0 2px 4px #8e8e8e">
            <div id="progressArea" style="height: 34px; background-color: #feffd2; padding: 4px; border-bottom: 1px solid black">
                <div id="progressControl" style="float: left">Form completion progress: <div id="progressBar" style="height: 14px; margin: 2px; border: 1px solid black; text-align: center"><div style="width: 300px; line-height: 120%; float: left; font-size: 12px" id="progressLabel"></div></div><div style="line-height: 30%"><!-- ie7 workaround --></div>
                </div>
                <div style="float: right"><button id="nextQuestion" type="button" class="buttonNorm nextQuestion"><img src="../libs/dynicons/?img=go-next.svg&amp;w=22" alt="Next" /> Next Question</button></div>
                <br style="clear: both" />
            </div>
            <div>
                <img src="images/indicator.gif" id="loadIndicator" style="visibility: hidden; float: right" alt="loading..." />
                <form id="record" enctype="multipart/form-data" action="javascript:void(0);">
                    <div>
                        <div id="xhr" style="padding: 16px"></div>
                        <!-- <button id="prevQuestion">Previous question</button> -->
                        <!-- <button class="button" dojoType="dijit.form.Button" onclick="checkForm(false);"><div id="save_indicator">Save Change</div></button> -->
                    </div>
                </form>
            </div>
            <div id="progressArea2" style="height: 34px; background-color: #feffd2; padding: 4px; border-top: 1px solid black">
                <div style="float: left"><button id="prevQuestion" type="button" class="buttonNorm prevQuestion"><img src="../libs/dynicons/?img=go-previous.svg&amp;w=22" alt="Previous" /> Previous Question</button></div>
                <div style="float: right"><button id="nextQuestion2" type="button" class="buttonNorm nextQuestion"><img src="../libs/dynicons/?img=go-next.svg&amp;w=22" alt="Next" /> Next Question</button></div>
            </div>
        </div>
        <br />
        <div id="container_center"></div>
    </div>
    <div class="col span_1_of_5" style="float: left">
        <div id="tools" class="tools"><h1 style="font-size: 12px; text-align: center; margin: 0; padding: 2px">Tools</h1>
            <div onclick="window.location='?a=printview&amp;recordID=<!--{$recordID}-->'"><img src="../libs/dynicons/?img=edit-find-replace.svg&amp;w=32" alt="View full form" title="View full form" /> Show single page</div>
            <br /><br />
            <div onclick="cancelRequest()"><img src="../libs/dynicons/?img=process-stop.svg&amp;w=16" alt="Cancel Request" title="Cancel Request" /> Cancel Request</div>
        </div>
    </div>
</div>


<!-- DIALOG BOXES -->
<div id="formContainer"></div>
<div id="xhrDialog" style="display: none"></div>
<div id="button_save" style="display: none"></div>
<div id="button_cancelchange" style="display: none"></div>
<!--{include file="site_elements/generic_confirm_xhrDialog.tpl"}-->

<script type="text/javascript">
/* <![CDATA[ */

var currIndicatorID = 0;
var currSeries = 0;
var CSRFToken = '<!--{$CSRFToken}-->';

function getForm(indicatorID, series) {
    $('.question').removeClass('buttonNormSelected');
    $('#q' + currFormPosition).addClass('buttonNormSelected');

    form.getForm(indicatorID, series);
}

function getNext() {
    currFormPosition++;
    if(currFormPosition < formStructure.length) {
        getForm(formStructure[currFormPosition].indicatorID, formStructure[currFormPosition].series);
    }
    else {
        window.location.href="index.php?a=printview&recordID=<!--{$recordID}-->";
    }

    return true;
}

function getPrev() {
    currFormPosition--;
    if(currFormPosition < 0) {
        currFormPosition = 0;
    }
    getForm(formStructure[currFormPosition].indicatorID, formStructure[currFormPosition].series);

    return true;
}

function treeClick(indicatorID, series) {
    form.setPostModifyCallback(function() {
        getForm(indicatorID, series);
        updateProgress();
    });
    form.dialog().clickSave();
}

function updateProgress() {
    $.ajax({
        type: 'GET',
        url: "./api/form/<!--{$recordID}-->/progress",
        dataType: 'json',
        success: function(response) {
            if(response < 100) {
                $('#progressBar').progressbar('option', 'value', response);
                $('#progressLabel').text(response + '%');
            }
            else {
                savechange = '<div class="buttonNorm" onclick="manualSaveChange();"><div id="save_indicator"><img src="../libs/dynicons/?img=media-floppy.svg&amp;w=22" alt="save" style="vertical-align: middle" /> Save Change</div></button>';
                $('#progressControl').html(savechange);
            }
        },
        cache: false
    });
}

function cancelRequest() {
    dialog_confirm.setContent('<img src="../libs/dynicons/?img=process-stop.svg&amp;w=48" alt="Cancel Request" style="float: left; padding-right: 24px" /> Are you sure you want to cancel this request?');

    dialog_confirm.setSaveHandler(function() {
        $.ajax({
            type: 'POST',
            url: 'ajaxIndex.php?a=cancel',
            data: {cancel: <!--{$recordID}-->,
                CSRFToken: '<!--{$CSRFToken}-->'},
            success: function(response) {
                if(response > 0) {
                    window.location.href="index.php?a=cancelled_request&cancelled=<!--{$recordID}-->";
                }
            },
            cache: false
        });
    });
    dialog_confirm.show();
}

function manualSaveChange()
{
    $("#save_indicator").html('<img src="images/indicator.gif" alt="Saving..." /> Saving...');
    setTimeout("$('#save_indicator').html('<img src=\"../libs/dynicons/?img=media-floppy.svg&amp;w=22\" alt=\"save\" style=\"vertical-align: middle\"/> Save Change')", 1000);
    form.setPostModifyCallback(function() {
    });
    form.dialog().clickSave();
}

//attempt to force a consistent width for the sidebar if there is enough desktop resolution
var lastScreenSize = null;
function sideBar() {
  if(lastScreenSize != window.innerWidth) {
      lastScreenSize = window.innerWidth;

      var tempNavtree = '';
      if($('#container_center').html() != '') {
    	  tempNavtree = $('#container_center').html();
      }
      if($('#container_left').html() != '') {
    	  tempNavtree = $('#container_left').html();
      }
      if(lastScreenSize <= 768) {
    	  $('#container_left').html('');
    	  $('#container_center').html(tempNavtree);
      }
      else {
          $('#container_center').html('');
          $('#container_left').html(tempNavtree);
      }
  }
}

var form;
var formValidator = {};
var formStructure = Array();
var currFormPosition = 0;
$(function() {
    $('#progressBar').progressbar({max: 100});

    form = new LeafForm('formContainer');
    form.initCustom('xhrDialog', 'xhr', 'loadIndicator', 'button_save', 'button_cancelchange');
    form.setRecordID(<!--{$recordID}-->);
    dialog_confirm = new dialogController('confirm_xhrDialog', 'confirm_xhr', 'confirm_loadIndicator', 'confirm_button_save', 'confirm_button_cancelchange');

    updateProgress();

    // load form structure
    $.ajax({
        type: 'GET',
        url: './api/form/<!--{$recordID}-->',
        success: function(res) {
            for(var i in res.items) {
                for(var j in res.items[i].children) {
                    var tmp = {};
                    tmp.category = res.items[i].name;
                    tmp.desc = res.items[i].children[j].desc;
                    tmp.indicatorID = res.items[i].children[j].indicatorID;
                    tmp.series = res.items[i].children[j].series;
                    formStructure.push(tmp);
                }
            }

            var buffer = '';
            var counter = 1;
            for(var i in formStructure) {
                var description = '';
                if(formStructure[i].desc.length > 25) {
                    description = formStructure[i].desc.substr(0, 25) + '...';
                }
                else {
                    description = formStructure[i].desc;
                }
                buffer += '<div id="q'+ i +'" class="buttonNorm question" style="border: 0px" onclick="currFormPosition='+i+';treeClick('+ formStructure[i].indicatorID +', '+ formStructure[i].series +');">' + counter + '. ' + description + '</div>';
                counter++;
            }
            $('#navtree').html(buffer);

            getForm(formStructure[0].indicatorID, formStructure[0].series);
        }
    });

    $('.nextQuestion').on('click', function() {
        form.dialog().indicateBusy();
        form.setPostModifyCallback(function() {
            getNext();
            updateProgress();
        });
        form.dialog().clickSave();
    });

    $('.prevQuestion').on('click', function() {
        form.dialog().indicateBusy();
        form.setPostModifyCallback(function() {
            getPrev();
            updateProgress();
        });
        form.dialog().clickSave();
    });

    sideBar();
    setInterval("sideBar()", 500);
});

/* ]]> */
</script>