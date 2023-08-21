def tag

pipeline {
    
    agent any
    environment {
        host = "test.isupplier-portal.com"
        namespace = "portal-dev"
        appName = "spbtest"
        registry = "harbor.isupplier-portal.com"
        registryCredential = "harbor"
        replicas=2
        port = 3020 //port pada pod
        targetPort = 3020
        ingressYaml="apiVersion: extensions/v1beta1\nkind: Ingress\nmetadata:\n  name: ${appName}-dev-ingress\n  namespace: ${namespace}\n  annotations:\n    kubernetes.io/ingress.class: traefik\n    traefik.frontend.rule.type: PathPrefixStrip\nspec:\n  rules:\n  - host: ${host}\n    http:\n      paths:\n      - backend:\n          serviceName: ${appName}\n          servicePort: ${targetPort}\n        path: /dev\n        pathType: Prefix\nstatus:\n  loadBalancer: {}"
    }    
    
    stages {
        stage('Preparation') {
            steps {
                //TODO: ambil dari package.json atau message commit
                script {
                    def packageJson = readJSON file: 'package.json'
                    tag = packageJson.version
                }
            }
        }
    
        stage('Building') {
            steps {
                script {
                    sh "docker build --rm -t ${registry}/jenkins/${appName}:${tag} ."
                    // sh "echo building"
                }
            }
        }
        
        stage('Push image ke registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'harbor', passwordVariable: 'password', usernameVariable: 'username')]) {
                  sh "docker login -u ${username} -p ${password} ${registry} && docker push ${registry}/jenkins/${appName}:${tag}"
                }           
                // sh "echo Push"
            }
        }
        
        stage('Deploy to dev') {
            steps {
                sshagent(['kube']) {
                    script {
                        try {
                            sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl delete deployment,service ${appName} --namespace=${namespace}'"
                                // sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl delete service ${appName} --namespace=${namespace}'"
                        } catch (Exception e) {}
                        sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl create deployment ${appName} --namespace=${namespace} --image=nexus.isupplier-portal.com/jenkins/${appName}:${tag} -- replicas=2'"
                        sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl scale deployment ${appName} --namespace=${namespace} --replicas=${replicas}'"
                        sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl expose deployment ${appName} --namespace=${namespace} --port=${port} --target-port=${targetPort}'"
                        sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl set env deployment ${appName} --namespace=${namespace} NODE_ENV=development'"
                    }
                }
            }
        }
        
        stage('Create Ingress Service') {
            steps {
                sshagent(['kube']) {
                    script {
                        try {
                            sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl get ingress ${appName}-ingress --namespace=${namespace}'"
                            //ingress ada, tidak perlu dibuat
                        } catch (Exception e) {
                            //buat ingress
                            sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'echo \"${ingressYaml}\" > ingress.yaml'"
                            sh "ssh -o StrictHostKeyChecking=no -l root 8.215.29.125 'kubectl apply -f ingress.yaml --namespace=${namespace}'"
                        }
                    }
                }
            }
        }
    }
}
