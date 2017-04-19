<?php
/************************
    Index for everything
    Date: September 11, 2007

*/

error_reporting(E_ALL & ~E_NOTICE);

if(false) {
    echo '<img src="../libs/dynicons/?img=dialog-error.svg&amp;w=96" alt="error" style="float: left" /><div style="font: 36px verdana">Site currently undergoing maintenance, will be back shortly!</div>';
    exit();
}

include 'globals.php';
include '../libs/smarty/Smarty.class.php';
include './sources/Login.php';
include 'db_mysql.php';
include 'config.php';

$config = new Orgchart\Config();

header('X-UA-Compatible: IE=edge');

// Enforce HTTPS
if(isset($config->enforceHTTPS) && $config->enforceHTTPS == true) {
    if(!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] != 'on') {
        header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
        exit();
    }
}

$db = new DB($config->dbHost, $config->dbUser, $config->dbPass, $config->dbName);

$login = new Orgchart\Login($db, $db);

$login->loginUser();
if(!$login->isLogin() || !$login->isInDB()) {
    echo 'Your login is not recognized.';
    exit;
}

$post_name = isset($_POST['name']) ? $_POST['name'] : '';
$post_password = isset($_POST['password']) ? $_POST['password'] : '';

$main = new Smarty;
$t_login = new Smarty;
$t_menu = new Smarty;
$o_login = '';
$o_menu = '';
$tabText = '';

$action = isset($_GET['a']) ? $_GET['a'] : '';

function customTemplate($tpl) {
	return file_exists("./templates/custom_override/{$tpl}") ? "custom_override/{$tpl}" : $tpl;
}

$main->assign('logo', '<img src="images/VA_icon_small.png" style="width: 80px" alt="VA logo" />');

$t_login->assign('name', $login->getName());

$main->assign('useDojo', true);
$main->assign('useDojoUI', true);

switch($action) {
    case 'about':
        $t_form = new Smarty;
        $t_form->left_delimiter = '<!--{';
        $t_form->right_delimiter= '}-->';
    
        $rev = $db->query("SELECT * FROM settings WHERE setting='dbversion'");
        $t_form->assign('dbversion', $rev[0]['data']);
    
        $main->assign('hideFooter', true);
        $main->assign('body', $t_form->fetch('view_about.tpl'));
        break;
    default:
    	if($action != ''
    		&& file_exists("templates/reports/{$action}.tpl")) {
    			$main->assign('useUI', true);
//    			$main->assign('javascripts', array('js/form.js', 'js/workflow.js', 'js/formGrid.js', 'js/formQuery.js', 'js/formSearch.js'));
    			if($login->isLogin()) {
    				$o_login = $t_login->fetch('login.tpl');
    			
    				$t_form = new Smarty;
    				$t_form->left_delimiter = '<!--{';
    				$t_form->right_delimiter= '}-->';
    				$t_form->assign('CSRFToken', $_SESSION['CSRFToken']);
    				$t_form->assign('empUID', $login->getEmpUID());
    				$t_form->assign('empMembership', $login->getMembership());
    			
    				//url
    				$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on' ? 'https' : 'http';
    				$qrcodeURL = "{$protocol}://{$_SERVER['HTTP_HOST']}" . $_SERVER['REQUEST_URI'];
    				$main->assign('qrcodeURL', urlencode($qrcodeURL));
    			
    				$main->assign('body', $t_form->fetch("reports/{$action}.tpl"));
    				$tabText = '';
    			}
    	}
    	else {
    		$main->assign('body', 'Input error');
    	}
        break;
}

$memberships = $login->getMembership();

$t_menu->assign('isAdmin', $memberships['groupID'][1]);
$t_menu->assign('action', $action);
$main->assign('login', $t_login->fetch('login.tpl'));
$o_menu = $t_menu->fetch('menu.tpl');
$main->assign('menu', $o_menu);
$tabText = $tabText == '' ? '' : $tabText . '&nbsp;';
$main->assign('tabText', $tabText);

$settings = $db->query_kv('SELECT * FROM settings', 'setting', 'data');
$main->assign('title', $settings['heading'] == '' ? $config->title : $settings['heading']);
$main->assign('city', $settings['subheading'] == '' ? $config->city : $settings['subheading']);
$main->assign('revision', $settings['version']);

if(!isset($_GET['iframe'])) {
	$main->display('main.tpl');
}
else {
	$main->display('main_iframe.tpl');
}