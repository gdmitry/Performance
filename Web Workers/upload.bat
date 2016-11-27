SET DENVER_PATH=z:\home\test1.ru\www
xcopy css\*.css  %DENVER_PATH%\css /i /s /y
xcopy images %DENVER_PATH%\images /i /s /y
xcopy scripts %DENVER_PATH%\scripts /i /s /y
xcopy index.html %DENVER_PATH% /i /s /y