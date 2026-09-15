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

                archiveArtifacts artifacts: 'frontend/build/**/*',
                                 fingerprint: true
            }
        }

        stage('Deploy') {
            steps {
                bat '''
                    echo ========================================
                    echo Deploying StudentHelpdesk
                    echo ========================================

                    echo.
                    echo ===== Deploying Backend =====

                    robocopy "%WORKSPACE%\\Backend" "C:\\StudentHelpdeskDeploy\\Backend" /E /XD node_modules /XF .env

                    if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%

                    cd /d C:\\StudentHelpdeskDeploy\\Backend

                    echo Installing backend dependencies...

                    call npm ci

                    echo Configuring PM2...

                    set "PM2_HOME=C:\\StudentHelpdeskDeploy\\.pm2"
                    set "JENKINS_NODE_COOKIE=dontKillMe"

                    echo Starting or restarting backend...

                    call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" restart studenthelpdesk-backend || call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" start server.js --name studenthelpdesk-backend

                    echo Saving PM2 process list...

                    call "C:\\Users\\hp\\AppData\\Roaming\\npm\\pm2.cmd" save

                    echo.
                    echo ===== Deploying Frontend to IIS =====

                    robocopy "%WORKSPACE%\\frontend\\build" "C:\\inetpub\\wwwroot\\StudentHelpdesk" /MIR

                    if %ERRORLEVEL% GEQ 8 exit /b %ERRORLEVEL%

                    echo.
                    echo ========================================
                    echo Deployment Completed Successfully
                    echo ========================================
                '''
            }
        }
    }
}