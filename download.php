<?php

$file = 'linkedin_data.txt';
header("Cache-Control: public");
header("Content-Description: File Transfer");
header("Content-Disposition: attachment; filename=$file");
header("Content-Type: text/plain\n\n");
header("Content-Transfer-Encoding: binary");
echo get_magic_quotes_gpc() ? stripslashes($_POST['data']) : $_POST['data'];
exit;
