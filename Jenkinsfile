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

        archiveArtifacts artifacts: 'frontend/build/**/*', fingerprint: true
    }
}