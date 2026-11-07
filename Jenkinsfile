pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        CI = 'true'
    }

    stages {

        stage('Plan') {
            steps {
                checkout scm

                script {
                    if (!fileExists('docs/PLAN.md')) {
                        error('Missing project plan')
                    }

                    if (isUnix()) {
                        sh 'node scripts/check-runtime.cjs'
                    } else {
                        bat 'node scripts/check-runtime.cjs'
                    }
                }
            }
        }

        stage('Code') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'node scripts/check-repository.cjs'
                    } else {
                        bat 'node scripts/check-repository.cjs'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm ci --prefix Backend'
                        sh 'npm ci --prefix frontend'

                        sh 'node --check Backend/server.js'
                        sh 'node --test Backend/passwords.test.js'

                        sh 'npm --prefix frontend test -- --watchAll=false --passWithNoTests'
                        sh 'npm --prefix frontend run build'
                    } else {
                        bat 'call npm ci --prefix Backend'
                        bat 'call npm ci --prefix frontend'

                        bat 'node --check Backend/server.js'
                        bat 'node --test Backend/passwords.test.js'

                        bat 'call npm --prefix frontend test -- --watchAll=false --passWithNoTests'
                        bat 'call npm --prefix frontend run build'
                    }
                }

                archiveArtifacts(
                    artifacts: 'frontend/build/**/*',
                    fingerprint: true
                )
            }
        }

        stage('Deploy') {
            steps {
                bat '''
                    @echo off

                    echo ========================================
                    echo StudentHelpdesk Deployment
                    echo ========================================

                    echo.
                    echo ===== BACKEND DEPLOYMENT =====

                    robocopy "%WORKSPACE%\\Backend" "C:\\StudentHelpdeskDeploy\\Backend" /E /XD node_modules /XF .env

                    set "RC=%ERRORLEVEL%"

                    if %RC% GEQ 8 (
                        echo Backend file copy failed.
                        exit /b %RC%
                    )

                    rem Robocopy codes 0-7 are successful
                    cmd /c exit 0

                    cd /d C:\\StudentHelpdeskDeploy\\Backend

                    echo.
                    echo Installing backend dependencies...

                    call npm ci

                    if errorlevel 1 (
                        echo npm ci failed.
                        exit /b 1
                    )

                    echo.
                    echo Configuring PM2...

                    set "PM2_HOME=C:\\StudentHelpdeskDeploy\\.pm2"
                    set "JENKINS_NODE_COOKIE=dontKillMe"

                    echo.
                    echo Restarting backend...

                    call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" restart studenthelpdesk-backend --update-env

                    if errorlevel 1 (
                        echo Backend process does not exist. Starting it...

                        call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" start server.js --name studenthelpdesk-backend

                        if errorlevel 1 (
                            echo PM2 failed to start backend.
                            exit /b 1
                        )
                    )

                    echo.
                    echo Saving PM2 process list...

                    call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" save

                    if errorlevel 1 (
                        echo PM2 save failed.
                        exit /b 1
                    )

                    echo.
                    echo ===== FRONTEND DEPLOYMENT =====

                    robocopy "%WORKSPACE%\\frontend\\build" "C:\\inetpub\\wwwroot\\StudentHelpdesk" /MIR

                    set "RC=%ERRORLEVEL%"

                    if %RC% GEQ 8 (
                        echo Frontend deployment failed.
                        exit /b %RC%
                    )

                    rem Robocopy codes 0-7 are successful
                    cmd /c exit 0

                    echo.
                    echo ========================================
                    echo DEPLOYMENT SUCCESSFUL
                    echo ========================================

                    exit /b 0
                '''
            }
        }
    }

    post {
        success {
            echo 'StudentHelpdesk CI/CD completed successfully.'
        }

        failure {
            echo 'StudentHelpdesk CI/CD failed. Check Console Output.'
        }
    }
}