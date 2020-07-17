#!/bin/bash


finish=False

while [ $finish != "True" ]
do
    clear 

    installing=()

    echo "this outputs deployments status in all Kalm related namespaces"
    echo ""

    ns_array=(kalm-operator cert-manager istio-system kalm-system)
    dp_cnt_array=(1 3 3 2)

    #for ns in ns_array
    for i in ${!ns_array[@]}
    do
        ns=${ns_array[i]}
        dp_cnt=${dp_cnt_array[i]}

        kubectl get deployments.apps -n $ns
        echo ""
    
        dp_status_output=$(kubectl get deployments.apps -n $ns -ojsonpath='{.items[*].status.conditions[?(@.type=="Available")].status}')
        dp_status_list=($dp_status_output)
    
        status_list_size=${#dp_status_list[@]}
    
        #echo $dp_status_output, ${dp_status_list[@]} $status_list_size
    
        if [ $status_list_size -lt $dp_cnt ]
        then
            installing+=($ns)
        else
            for status in $dp_status_list 
            do
                if [ $status == "True" ]
                then
                    continue
                fi
    
                installing+=($ns)
                break
            done
        fi
    done
    
    installing_list_size=${#installing[@]}
    if [ $installing_list_size -gt 0 ]
    then
        echo "⌛ waiting for installing of: ${installing[@]}"
        sleep 3
    else
        finish="True"
        echo "🎉 installing done"
    fi
done
